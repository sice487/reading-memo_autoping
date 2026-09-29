'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { ItemStatus, ItemType, ItemWithRecord } from '@/types/item'
import ItemCard from './ItemCard'
import ItemRow from './ItemRow'
import RegisterModal from './RegisterModal'

type SortKey = 'created_at' | 'completed_date' | 'rating' | 'title'
type ViewMode = 'grid' | 'list'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'created_at', label: '登録日' },
  { value: 'completed_date', label: '読了日・視聴日' },
  { value: 'rating', label: '評価' },
  { value: 'title', label: 'タイトル(五十音)' },
]

const typeOptions: { value: ItemType; label: string }[] = [
  { value: 'book', label: '本' },
  { value: 'manga', label: '漫画' },
  { value: 'movie', label: '映画' },
  { value: 'anime', label: 'アニメ' },
  { value: 'drama', label: 'ドラマ' },
]

interface Filters {
  types: ItemType[]
  ratingMin: number | null
  ratingMax: number | null
  createdFrom: string
  createdTo: string
  completedFrom: string
  completedTo: string
}

const defaultFilters: Filters = {
  types: [],
  ratingMin: null,
  ratingMax: null,
  createdFrom: '',
  createdTo: '',
  completedFrom: '',
  completedTo: '',
}

function isFilterActive(f: Filters): boolean {
  return (
    f.types.length > 0 ||
    f.ratingMin !== null ||
    f.ratingMax !== null ||
    !!f.createdFrom ||
    !!f.createdTo ||
    !!f.completedFrom ||
    !!f.completedTo
  )
}

function applyFiltersAndSort(
  items: ItemWithRecord[],
  query: string,
  filters: Filters,
  sortKey: SortKey
): ItemWithRecord[] {
  let result = [...items]

  // タイトル検索(部分一致)
  if (query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter((item) => item.title.toLowerCase().includes(q))
  }

  // 種別フィルター
  if (filters.types.length > 0) {
    result = result.filter((item) => filters.types.includes(item.type))
  }

  // 評価フィルター
  if (filters.ratingMin !== null) {
    result = result.filter(
      (item) => (item.records?.[0]?.rating ?? 0) >= filters.ratingMin!
    )
  }
  if (filters.ratingMax !== null) {
    result = result.filter(
      (item) => (item.records?.[0]?.rating ?? 6) <= filters.ratingMax!
    )
  }

  // 登録日フィルター
  if (filters.createdFrom) {
    result = result.filter((item) => item.created_at.slice(0, 10) >= filters.createdFrom)
  }
  if (filters.createdTo) {
    result = result.filter((item) => item.created_at.slice(0, 10) <= filters.createdTo)
  }

  // 読了日フィルター
  if (filters.completedFrom) {
    result = result.filter(
      (item) => (item.records?.[0]?.completed_date ?? '') >= filters.completedFrom
    )
  }
  if (filters.completedTo) {
    result = result.filter(
      (item) => (item.records?.[0]?.completed_date ?? '') <= filters.completedTo
    )
  }

  // ソート
  result.sort((a, b) => {
    switch (sortKey) {
      case 'completed_date': {
        const da = a.records?.[0]?.completed_date ?? ''
        const db = b.records?.[0]?.completed_date ?? ''
        return db.localeCompare(da)
      }
      case 'rating': {
        const ra = a.records?.[0]?.rating ?? 0
        const rb = b.records?.[0]?.rating ?? 0
        return rb - ra
      }
      case 'title':
        return a.title.localeCompare(b.title, 'ja')
      case 'created_at':
      default:
        return b.created_at.localeCompare(a.created_at)
    }
  })

  return result
}

const inputClass =
  'w-full rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
const labelClass = 'mb-1 block text-[11px] text-ink/50'

export default function ItemList({ status }: { status: ItemStatus }) {
  const [items, setItems] = useState<ItemWithRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabaseBrowser
      .from('items')
      .select(`
        *,
        records (
          id,
          completed_date,
          rating,
          review
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setItems((data ?? []) as ItemWithRecord[])
    }
    setLoading(false)
  }, [status])

  useEffect(() => {
    fetchItems()
    // タブ切替時にリセット
    setQuery('')
    setFilters(defaultFilters)
    setFilterOpen(false)
  }, [fetchItems])

  function toggleType(type: ItemType) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }))
  }

  function resetFilters() {
    setFilters(defaultFilters)
    setQuery('')
  }

  const active = isFilterActive(filters) || !!query.trim()
  const displayedItems = applyFiltersAndSort(items, query, filters, sortKey)

  const emptyMessage =
    status === 'wishlist'
      ? 'まだ何も登録されていません。気になる本や映画を登録してみましょう。'
      : 'まだ記録済みのアイテムはありません。読み終えた作品を登録してみましょう。'

  if (loading) {
    return <p className="py-16 text-center text-sm text-ink/40">読み込み中…</p>
  }

  if (error) {
    return (
      <p className="py-16 text-center text-sm text-red-700">読み込めませんでした: {error}</p>
    )
  }

  return (
    <div>
      {/* 検索バー */}
      <div className="mb-2 flex gap-2">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/30"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトルで検索…"
            className="w-full rounded-lg border border-ink/15 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>

        {/* フィルターボタン */}
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
            isFilterActive(filters)
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-ink/15 bg-white text-ink/60 hover:bg-ink/5'
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path d="M1 3h14v1.5L10 9v5l-4-2V9L1 4.5V3z" />
          </svg>
          フィルター
          {isFilterActive(filters) && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* フィルターパネル */}
      {filterOpen && (
        <div className="mb-3 space-y-3 rounded-xl border border-ink/10 bg-white p-4">

          {/* 種別 */}
          <div>
            <p className={labelClass}>種別</p>
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleType(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    filters.types.includes(opt.value)
                      ? 'bg-ink text-white'
                      : 'border border-ink/15 text-ink/60 hover:bg-ink/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 評価 */}
          <div>
            <p className={labelClass}>評価</p>
            <div className="flex items-center gap-2">
              <select
                value={filters.ratingMin ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    ratingMin: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className={inputClass}
              >
                <option value="">下限なし</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>★{n}</option>
                ))}
              </select>
              <span className="shrink-0 text-xs text-ink/40">〜</span>
              <select
                value={filters.ratingMax ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    ratingMax: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className={inputClass}
              >
                <option value="">上限なし</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>★{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 登録日 */}
          <div>
            <p className={labelClass}>登録日</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.createdFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, createdFrom: e.target.value }))
                }
                className={inputClass}
              />
              <span className="shrink-0 text-xs text-ink/40">〜</span>
              <input
                type="date"
                value={filters.createdTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, createdTo: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* 読了日(記録済みタブのみ表示) */}
          {status === 'completed' && (
            <div>
              <p className={labelClass}>読了日・視聴日</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.completedFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, completedFrom: e.target.value }))
                  }
                  className={inputClass}
                />
                <span className="shrink-0 text-xs text-ink/40">〜</span>
                <input
                  type="date"
                  value={filters.completedTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, completedTo: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* リセット */}
          {isFilterActive(filters) && (
            <button
              type="button"
              onClick={() => setFilters(defaultFilters)}
              className="text-xs text-accent underline-offset-2 hover:underline"
            >
              フィルターをリセット
            </button>
          )}
        </div>
      )}

      {/* ツールバー(ソート + 表示切替) */}
      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="flex-1 rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}順
              </option>
            ))}
          </select>

          <div className="flex overflow-hidden rounded-lg border border-ink/15">
            <button
              onClick={() => setViewMode('grid')}
              title="グリッド表示"
              className={`flex h-8 w-8 items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-ink text-white' : 'bg-white text-ink/40 hover:bg-ink/5'
              }`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="リスト表示"
              className={`flex h-8 w-8 items-center justify-center transition-colors ${
                viewMode === 'list' ? 'bg-ink text-white' : 'bg-white text-ink/40 hover:bg-ink/5'
              }`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="1" y="7" width="14" height="2" rx="1" />
                <rect x="1" y="12" width="14" height="2" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 検索/フィルター結果件数 */}
      {active && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-ink/50">
            {displayedItems.length}件表示
            {items.length !== displayedItems.length && ` / 全${items.length}件`}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
            すべてクリア
          </button>
        </div>
      )}

      {/* アイテム一覧 */}
      {displayedItems.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/40">
          {active ? '条件に一致するアイテムが見つかりません' : emptyMessage}
        </p>
      ) : viewMode === 'grid' ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {displayedItems.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} onUpdated={fetchItems} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {displayedItems.map((item) => (
            <li key={item.id}>
              <ItemRow item={item} onUpdated={fetchItems} />
            </li>
          ))}
        </ul>
      )}

      <RegisterModal status={status} onSaved={fetchItems} />
    </div>
  )
}