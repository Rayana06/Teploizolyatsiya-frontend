import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  getMyInsulationMaterialDraft,
  startInsulationMaterialDraft,
  fillInsulationMaterialDraft,
  publishInsulationMaterial,
  deleteInsulationMaterial,
  getFirstFeedMaterial,
  getInsulationMaterials,
  getNextFeedMaterial,
  setInsulationMaterialLike,
} from '../api/generated/insulationMaterialsApi'
import type { FeedMaterial, CatalogMaterial, StartDraft, FillDraft, MaterialDetails } from '../api/generated/models'
import { materialsMock } from '../data/materials'
import type { InsulationMaterial } from '../types/material'
import type { RootState } from './store'

const fromCatalog = (item: CatalogMaterial): InsulationMaterial => ({
  id: item.id,
  name: item.name,
  brand: item.brand ?? 'ТЕПЛОЩИТ',
  shortDescription: item.shortDescription ?? '',
  insulationType: item.insulationType ?? 'Другое',
  application: item.application ?? '',
  thicknessMm: item.thicknessMm ?? 0,
  priceRubM2: item.priceRubM2 ?? 0,
  publishedAt: item.publishedAt ?? '',
  imageUrl: proxySiloUrl(item.imageUrl),
  feedImageUrl: null,
  videoUrl: proxySiloUrl(item.videoUrl ?? null),
  likeCount: item.likeCount,
  isCreator: item.isCreator,
  liked: 0,
  source: 'backend',
})

const fromFeed = (item: FeedMaterial): InsulationMaterial => ({
  ...fromCatalog(item),
  shortDescription: item.shortDescription ?? 'Без описания',
  videoUrl: proxySiloUrl(item.videoUrl),
  liked: item.liked,
})

function proxySiloUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return `/silo${parsed.pathname}`
  } catch {
    return url
  }
}

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) return String(error.message)
  return 'Не удалось выполнить запрос'
}

export const loadCatalog = createAsyncThunk<
  { items: InsulationMaterial[]; source: 'backend' | 'mock' },
  void,
  { state: RootState; rejectValue: string }
>('materials/loadCatalog', async (_, { getState, rejectWithValue }) => {
  const { applied } = getState().filters
  try {
    const response = await getInsulationMaterials({
      search: applied.search || undefined,
      insulationType: applied.insulationType || undefined,
      maxThicknessMm: applied.maxThicknessMm < 1000 ? applied.maxThicknessMm : undefined,
      maxPriceRubM2: applied.maxPriceRubM2 < 1570.15 ? applied.maxPriceRubM2 : undefined,
      view: 'rich',
    })
    return { items: response.items.map(fromCatalog), source: 'backend' }
  } catch (error) {
    if (getState().auth.user) return rejectWithValue(errorMessage(error))
    const search = applied.search.trim().toLocaleLowerCase('ru-RU')
    const items = materialsMock.filter((item) =>
      item.thicknessMm <= applied.maxThicknessMm
      && item.priceRubM2 <= applied.maxPriceRubM2
      && (!applied.insulationType || item.insulationType === applied.insulationType)
      && (!search || item.name.toLocaleLowerCase('ru-RU').includes(search)),
    )
    return { items, source: 'mock' }
  }
})

export const loadFirstFeedMaterial = createAsyncThunk<InsulationMaterial, void, { state: RootState; rejectValue: string }>(
  'materials/loadFirstFeedMaterial',
  async (_, { getState, rejectWithValue }) => {
    try {
      return fromFeed(await getFirstFeedMaterial({ view: 'rich' }))
    } catch (error) {
      if (getState().auth.user) return rejectWithValue(errorMessage(error))
      return materialsMock[0]
    }
  },
)

export const loadNextFeedMaterial = createAsyncThunk<InsulationMaterial, void, { state: RootState; rejectValue: string }>(
  'materials/loadNextFeedMaterial',
  async (_, { getState, rejectWithValue }) => {
    const current = getState().materials.feed
    if (!current || current.source === 'mock') {
      const index = materialsMock.findIndex((item) => item.id === current?.id)
      return materialsMock[(index + 1) % materialsMock.length]
    }
    try {
      return fromFeed(await getNextFeedMaterial(current.id, { next: 'true', view: 'rich' }))
    } catch (error) {
      return rejectWithValue(errorMessage(error))
    }
  },
)

export const loadMyDraft = createAsyncThunk<MaterialDetails | null, void, { rejectValue: string }>(
  'materials/loadMyDraft', async (_, { rejectWithValue }) => {
    try { return (await getMyInsulationMaterialDraft()) || null }
    catch (error) { return rejectWithValue(errorMessage(error)) }
  },
)

export const startMaterialDraft = createAsyncThunk<MaterialDetails, StartDraft, { rejectValue: string }>(
  'materials/startMaterialDraft', async (form, { rejectWithValue }) => {
    try { return await startInsulationMaterialDraft(form) }
    catch (error) { return rejectWithValue(errorMessage(error)) }
  },
)

export const publishMaterialDraft = createAsyncThunk<MaterialDetails, { id: number; fields: FillDraft }, { rejectValue: string }>(
  'materials/publishMaterialDraft', async ({ id, fields }, { rejectWithValue }) => {
    try {
      await fillInsulationMaterialDraft(id, fields)
      return await publishInsulationMaterial(id)
    } catch (error) { return rejectWithValue(errorMessage(error)) }
  },
)

export const removeMaterial = createAsyncThunk<number, number, { rejectValue: string }>(
  'materials/removeMaterial',
  async (id, { rejectWithValue }) => {
    try { await deleteInsulationMaterial(id); return id }
    catch (error) { return rejectWithValue(errorMessage(error)) }
  },
)

export const toggleFeedLike = createAsyncThunk<
  { id: number; liked: 0 | 1; likeCount: number },
  void,
  { state: RootState; rejectValue: string }
>('materials/toggleFeedLike', async (_, { getState, rejectWithValue }) => {
  const current = getState().materials.feed
  if (!current) return rejectWithValue('Нет текущей услуги')
  const liked = current.liked ? 0 : 1
  try { return await setInsulationMaterialLike(current.id, { liked }) }
  catch (error) { return rejectWithValue(errorMessage(error)) }
})

interface MaterialsState {
  catalog: InsulationMaterial[]
  feed: InsulationMaterial | null
  draft: MaterialDetails | null
  source: 'backend' | 'mock' | null
  pending: number
  error: string | null
}

const initialState: MaterialsState = { catalog: [], feed: null, draft: null, source: null, pending: 0, error: null }

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    clearPrivateMaterials(state) {
      state.draft = null
      state.feed = null
      state.catalog = []
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadCatalog.fulfilled, (state, action) => {
        state.catalog = action.payload.items
        state.source = action.payload.source
      })
      .addCase(loadFirstFeedMaterial.fulfilled, (state, action) => { state.feed = action.payload })
      .addCase(loadNextFeedMaterial.fulfilled, (state, action) => { state.feed = action.payload })
      .addCase(loadMyDraft.fulfilled, (state, action) => { state.draft = action.payload })
      .addCase(startMaterialDraft.fulfilled, (state, action) => { state.draft = action.payload })
      .addCase(publishMaterialDraft.fulfilled, (state) => { state.draft = null })
      .addCase(removeMaterial.fulfilled, (state, action) => {
        state.catalog = state.catalog.filter((item) => item.id !== action.payload)
      })
      .addCase(toggleFeedLike.fulfilled, (state, action) => {
        if (state.feed?.id === action.payload.id) {
          state.feed.liked = action.payload.liked
          state.feed.likeCount = action.payload.likeCount
        }
      })
      .addMatcher((action) => action.type.startsWith('materials/') && action.type.endsWith('/pending'), (state) => {
        state.pending += 1
        state.error = null
      })
      .addMatcher((action) => action.type.startsWith('materials/') && action.type.endsWith('/fulfilled'), (state) => {
        state.pending = Math.max(0, state.pending - 1)
      })
      .addMatcher((action) => action.type.startsWith('materials/') && action.type.endsWith('/rejected'), (state, action) => {
        state.pending = Math.max(0, state.pending - 1)
        const payload = (action as { payload?: unknown }).payload
        state.error = typeof payload === 'string' ? payload : 'Ошибка AJAX-запроса'
      })
  },
})

export const { clearPrivateMaterials } = materialsSlice.actions
export default materialsSlice.reducer
