import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createItem, updateItem, deleteItem, addNote, addLink, fetchAllItems } from '@/lib/db'
import { formatDeadline, daysUntilDeadline, getEffectiveStatus, STATUS_LABELS } from '@/lib/utils'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_item',
      description: 'Create a new objective, key result, or task',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['objective', 'key_result', 'task'] },
          title: { type: 'string' },
          team: { type: 'string', enum: ['engineering', 'product', 'commercial', 'operations'] },
          deadline_type: { type: 'string', enum: ['date', 'month', 'quarter'] },
          deadline_value: { type: 'string', description: 'ISO date string YYYY-MM-DD' },
          parent_id: { type: 'string', description: 'UUID of parent item (optional)' },
          description: { type: 'string' },
          owners: { type: 'array', items: { type: 'string' }, description: 'List of owner names' },
        },
        required: ['type', 'title', 'team', 'deadline_type', 'deadline_value', 'owners'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_item',
      description: 'Update an existing item by ID. Use this to change status, title, deadline, owners, etc.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the item to update' },
          title: { type: 'string' },
          description: { type: 'string' },
          team: { type: 'string', enum: ['engineering', 'product', 'commercial', 'operations'] },
          status: { type: 'string', enum: ['not_started', 'on_track', 'at_risk', 'missed', 'done'] },
          deadline_type: { type: 'string', enum: ['date', 'month', 'quarter'] },
          deadline_value: { type: 'string', description: 'ISO date string YYYY-MM-DD' },
          owners: { type: 'array', items: { type: 'string' } },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_item',
      description: 'Delete an item and all its children',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the item to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_note',
      description: 'Add a note/comment to an item',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['item_id', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_link',
      description: 'Add a labeled link/reference to an item (Slack, Notion, etc.)',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string' },
          label: { type: 'string', description: 'Display label, e.g. "Slack thread - contract review"' },
          url: { type: 'string' },
        },
        required: ['item_id', 'label', 'url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_weekly_summary',
      description: 'Generate a weekly summary of all items across all teams',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
]

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'create_item':
      return await createItem(args as Parameters<typeof createItem>[0])
    case 'update_item': {
      const { id, ...updates } = args as { id: string } & Parameters<typeof updateItem>[1]
      await updateItem(id, updates)
      return { success: true, id }
    }
    case 'delete_item':
      await deleteItem(args.id as string)
      return { success: true }
    case 'add_note':
      return await addNote(args.item_id as string, args.content as string)
    case 'add_link':
      return await addLink(args.item_id as string, args.label as string, args.url as string)
    case 'generate_weekly_summary': {
      const items = await fetchAllItems()
      const missed = items.filter(i => getEffectiveStatus(i) === 'missed')
      const atRisk = items.filter(i => getEffectiveStatus(i) === 'at_risk')
      const done = items.filter(i => i.status === 'done')
      const upcoming = items.filter(i => {
        const days = daysUntilDeadline(i.deadline_value)
        return days >= 0 && days <= 7 && i.status !== 'done'
      })
      return {
        total: items.length,
        missed: missed.map(i => ({ title: i.title, team: i.team, deadline: formatDeadline(i.deadline_type, i.deadline_value) })),
        at_risk: atRisk.map(i => ({ title: i.title, team: i.team, deadline: formatDeadline(i.deadline_type, i.deadline_value) })),
        completed: done.map(i => ({ title: i.title, team: i.team })),
        due_this_week: upcoming.map(i => ({ title: i.title, team: i.team, days_left: daysUntilDeadline(i.deadline_value), status: STATUS_LABELS[getEffectiveStatus(i)] })),
      }
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

export async function POST(req: NextRequest) {
  const { messages, currentItemId, currentItemTitle } = await req.json()

  const systemPrompt = `You are an operations orchestration agent for LightWork AI, a 20-30 person startup.
You help the Founder's Associate manage team objectives, key results, and tasks through natural conversation.

You have access to tools to create, update, delete items, add notes, add links, and generate weekly summaries.
The item hierarchy is: Objective → Key Result → Task (max 3 levels).
Teams: engineering, product, commercial, operations.
Statuses: not_started, on_track, at_risk, missed, done.

${currentItemId ? `The user is currently viewing: "${currentItemTitle}" (ID: ${currentItemId}). When they say "this", "it", "here" etc., they mean this item.` : 'The user is on the main dashboard.'}

Be concise and action-oriented. When you perform an action, briefly confirm what you did.
If you need an item ID that isn't clear from context, ask the user to clarify which item they mean.
When generating a weekly summary, present it in a clear, structured format.
Today's date is ${new Date().toISOString().split('T')[0]}.`

  const response = await client.chat.completions.create({
    model: 'anthropic/claude-sonnet-4-5',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    tools,
    tool_choice: 'auto',
  })

  const message = response.choices[0].message

  // Handle tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolResults = await Promise.all(
      message.tool_calls.map(async tc => {
        const fn = (tc as { function: { name: string; arguments: string } }).function
        const result = await executeTool(fn.name, JSON.parse(fn.arguments))
        return {
          role: 'tool' as const,
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        }
      })
    )

    const followUp = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        message,
        ...toolResults,
      ],
      tools,
      tool_choice: 'none',
    })

    return NextResponse.json({
      message: followUp.choices[0].message.content,
      toolCalls: message.tool_calls.map(tc => (tc as { function: { name: string } }).function.name),
      refreshData: true,
    })
  }

  return NextResponse.json({
    message: message.content,
    toolCalls: [],
    refreshData: false,
  })
}
