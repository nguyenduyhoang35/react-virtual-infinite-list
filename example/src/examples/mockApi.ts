// ============ Types ============
export interface Item {
  id: number
  title: string
  description: string
  avatar: string
}

// Rick and Morty API types
interface RickMortyCharacter {
  id: number
  name: string
  status: string
  species: string
  gender: string
  image: string
  location: { name: string }
  origin: { name: string }
}

interface RickMortyResponse {
  info: {
    count: number
    pages: number
    next: string | null
    prev: string | null
  }
  results: RickMortyCharacter[]
}

// Transform Rick and Morty character to our Item type
const transformCharacter = (char: RickMortyCharacter): Item => ({
  id: char.id,
  title: char.name,
  description: `${char.species} - ${char.status} | Origin: ${char.origin.name} | Location: ${char.location.name}`,
  avatar: char.image,
})

// ============ Page-based API (Rick and Morty) ============
export interface PageResponse {
  data: Item[]
  total: number
  page: number
  totalPages: number
}

export const fetchItemsByPage = async (
  page: number,
  _limit: number // Rick and Morty API uses fixed 20 per page
): Promise<PageResponse> => {
  const response = await fetch(
    `https://rickandmortyapi.com/api/character?page=${page}`
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data: RickMortyResponse = await response.json()

  return {
    data: data.results.map(transformCharacter),
    total: data.info.count,
    page,
    totalPages: data.info.pages,
  }
}

// ============ Cursor-based API (Rick and Morty) ============
export interface CursorResponse {
  data: Item[]
  nextCursor: string | null
  prevCursor: string | null
}

export const fetchItemsByCursor = async (
  cursor: string | null,
  _limit: number
): Promise<CursorResponse> => {
  // cursor is the page number as string, or null for first page
  const page = cursor ? parseInt(cursor, 10) : 1

  const response = await fetch(
    `https://rickandmortyapi.com/api/character?page=${page}`
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data: RickMortyResponse = await response.json()

  // Extract page numbers from next/prev URLs
  const getPageFromUrl = (url: string | null): string | null => {
    if (!url) return null
    const match = url.match(/page=(\d+)/)
    return match ? match[1] : null
  }

  return {
    data: data.results.map(transformCharacter),
    nextCursor: getPageFromUrl(data.info.next),
    prevCursor: getPageFromUrl(data.info.prev),
  }
}

// ============ Large dataset (Mock - for virtual list demo) ============
// Keep mock data for virtual list since we need 10k items
const generateItems = (count: number, startId: number): Item[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    title: `Item ${startId + i}`,
    description: `This is item #${startId + i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${startId + i}`,
  }))
}

export const fetchLargeDataset = async (
  page: number,
  limit: number
): Promise<PageResponse> => {
  // Simulate small delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const total = 10000
  const startId = (page - 1) * limit + 1
  const remainingItems = Math.max(0, total - (page - 1) * limit)
  const itemCount = Math.min(limit, remainingItems)

  return {
    data: generateItems(itemCount, startId),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
