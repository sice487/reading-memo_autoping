'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { ItemStatus, ItemWithRecord } from '@/types/item'
import ItemCard from './ItemCard'
import RegisterModal from './RegisterModal'

export default function ItemList({ status }: { status: ItemStatus }) {
  const [items, setItems] = useState<ItemWithRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

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
          review,
          record_tags (
            tags ( id, name )
          )
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
    setSelectedTag(null)
  }, [fetchItems])

  // 全タグを抽出(重複除去・五十音順)
  const allTags = Array.from(
    new Set(
      items.flatMap((item) =>
        item.records.flatMap((r) => r.record_tags.map((rt) => rt.tags.name))
      )
    )
  ).sort()

  const filteredItems = selectedTag
    ? items.filter((item) =>
        item.records.some((r) =>
          r.record_tags.some((rt) => rt.tags.name === selectedTag)
        )
      )
    : items

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
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              selectedTag === null
                ? 'bg-ink text-white'
                : 'border border-ink/15 text-ink/60 hover:bg-ink/5'
            }`}
          >
            すべて
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                selectedTag === tag
                  ? 'bg-ink text-white'
                  : 'border border-ink/15 text-ink/60 hover:bg-ink/5'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/40">
          {selectedTag ? `「${selectedTag}」のアイテムはありません` : emptyMessage}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} onUpdated={fetchItems} />
            </li>
          ))}
        </ul>
      )}

      <RegisterModal status={status} onSaved={fetchItems} />
    </div>
  )
}