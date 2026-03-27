import { supabase, Item, Note, Link, StatusType, ItemType, TeamType, DeadlineType } from './supabase'
import { getEffectiveStatus, worstStatus } from './utils'

// Fetch all items with owners
export async function fetchAllItems(): Promise<Item[]> {
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .order('deadline_value', { ascending: true })

  if (error) throw error

  const { data: owners } = await supabase.from('item_owners').select('*')

  return items.map((item: Item) => ({
    ...item,
    owners: owners?.filter((o: { item_id: string; owner_name: string }) => o.item_id === item.id).map((o: { owner_name: string }) => o.owner_name) ?? [],
  }))
}

// Build hierarchy tree
export function buildTree(items: Item[]): Item[] {
  const map = new Map<string, Item>()
  items.forEach(item => map.set(item.id, { ...item, children: [] }))

  const roots: Item[] = []
  map.forEach(item => {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(item)
    } else if (!item.parent_id) {
      roots.push(item)
    }
  })

  // Bubble up status
  function bubbleStatus(item: Item): StatusType {
    if (!item.children || item.children.length === 0) {
      return getEffectiveStatus(item)
    }
    const childStatuses = item.children.map(bubbleStatus)
    return worstStatus(childStatuses)
  }

  map.forEach(item => {
    item.status = bubbleStatus(item)
  })

  return roots
}

export async function fetchItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).single()
  if (error) return null
  const { data: owners } = await supabase.from('item_owners').select('*').eq('item_id', id)
  return { ...data, owners: owners?.map((o: { owner_name: string }) => o.owner_name) ?? [] }
}

export async function createItem(params: {
  type: ItemType
  title: string
  team: TeamType
  deadline_type: DeadlineType
  deadline_value: string
  parent_id?: string
  description?: string
  owners: string[]
}): Promise<Item> {
  const { owners, ...itemData } = params
  const { data, error } = await supabase.from('items').insert(itemData).select().single()
  if (error) throw error

  if (owners.length > 0) {
    await supabase.from('item_owners').insert(owners.map(name => ({ item_id: data.id, owner_name: name })))
  }

  return { ...data, owners }
}

export async function updateItem(id: string, updates: Partial<{
  title: string
  description: string
  team: TeamType
  status: StatusType
  deadline_type: DeadlineType
  deadline_value: string
  parent_id: string
  owners: string[]
}>): Promise<void> {
  const { owners, ...itemUpdates } = updates
  if (Object.keys(itemUpdates).length > 0) {
    await supabase.from('items').update(itemUpdates).eq('id', id)
  }
  if (owners !== undefined) {
    await supabase.from('item_owners').delete().eq('item_id', id)
    if (owners.length > 0) {
      await supabase.from('item_owners').insert(owners.map(name => ({ item_id: id, owner_name: name })))
    }
  }
}

export async function deleteItem(id: string): Promise<void> {
  await supabase.from('items').delete().eq('id', id)
}

export async function fetchNotes(itemId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addNote(itemId: string, content: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ item_id: itemId, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchLinks(itemId: string): Promise<Link[]> {
  const { data, error } = await supabase.from('links').select('*').eq('item_id', itemId)
  if (error) throw error
  return data
}

export async function addLink(itemId: string, label: string, url: string): Promise<Link> {
  const { data, error } = await supabase
    .from('links')
    .insert({ item_id: itemId, label, url })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLink(linkId: string): Promise<void> {
  await supabase.from('links').delete().eq('id', linkId)
}
