export type MaterialType = string

export interface InsulationMaterial {
  id: number
  name: string
  brand: string
  shortDescription: string
  insulationType: MaterialType
  application: string
  thicknessMm: number
  priceRubM2: number
  publishedAt: string
  imageUrl: string | null
  feedImageUrl: string | null
  videoUrl: string | null
  likeCount: number
  isCreator?: 0 | 1
  liked?: 0 | 1
  source?: 'backend' | 'mock'
}

export type MaterialSort = 'newest' | 'name' | 'price-asc' | 'price-desc'
