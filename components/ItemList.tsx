'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { ItemStatus, ItemWithRecord } from '@/types/item'
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

function sortItems(items: ItemWithRecord[], key: SortKey): ItemWithRecord[] {
  return [...items].sort((a, b) => {
    switch (key) {
      case 'completed_date': {
        const da = a.records?.[0]?.completed_date ?? ''
        const db = b.records?.[0]?.completed_date ?? ''
        return db.localeCompare(da) // 新しい順
      }
      case 'rating': {
        const ra = a.records?.[0]?.rating ?? 0
        const rb = b.records?.[0]?.rating ?? 0
        return rb - ra // 高い順
      }
      case 'title':
        return a.title.localeCompare(b.title, 'ja') // 五十音順
      case 'created_at':
      default:
        return b.created_at.localeCompare(a.created_at) // 新しい順
    }
  })
}

export default function ItemList({ status }: { status: ItemStatus }) {
  const [items, setItems] = useState<ItemWithRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

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
  }, [fetchItems])

  const sortedItems = sortItems(items, sortKey)

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
      {/* ツールバー */}
      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          {/* ソート */}
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

          {/* 表示切替 */}
          <div className="flex overflow-hidden rounded-lg border border-ink/15">
            <button
              onClick={() => setViewMode('grid')}
              title="グリッド表示"
              className={`flex h-8 w-8 items-center justify-center text-sm transition-colors ${
                viewMode === 'grid' ? 'bg-ink text-white' : 'bg-white text-ink/40 hover:bg-ink/5'
              }`}
            >
              {/* グリッドアイコン */}
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
              className={`flex h-8 w-8 items-center justify-center text-sm transition-colors ${
                viewMode === 'list' ? 'bg-ink text-white' : 'bg-white text-ink/40 hover:bg-ink/5'
              }`}
            >
              {/* リストアイコン */}
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="1" y="7" width="14" height="2" rx="1" />
                <rect x="1" y="12" width="14" height="2" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {sortedItems.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/40">{emptyMessage}</p>
      ) : viewMode === 'grid' ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sortedItems.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} onUpdated={fetchItems} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {sortedItems.map((item) => (
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