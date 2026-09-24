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
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/40">{emptyMessage}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
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