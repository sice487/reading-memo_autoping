export type ItemType = 'book' | 'manga' | 'movie' | 'anime' | 'drama'
export type ItemStatus = 'wishlist' | 'completed'

export interface Item {
  id: string
  type: ItemType
  title: string
  creator: string | null
  publisher: string | null
  thumbnail_url: string | null
  status: ItemStatus
  external_source: string | null
  external_id: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface ItemWithRecord extends Item {
  records: {
    id: string
    completed_date: string
    rating: number | null
    review: string | null
  }[]
}