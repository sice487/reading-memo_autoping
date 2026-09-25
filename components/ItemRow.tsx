'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ItemWithRecord } from '@/types/item'
import ItemDetailModal from './ItemDetailModal'

const typeLabel: Record<ItemWithRecord['type'], string> = {
  book: '本',
  manga: '漫画',
  movie: '映画',
  anime: 'アニメ',
  drama: 'ドラマ',
}

const typeClass: Record<ItemWithRecord['type'], string> = {
  book: 'bg-type-book text-type-book-ink',
  manga: 'bg-type-manga text-type-manga-ink',
  movie: 'bg-type-movie text-type-movie-ink',
  anime: 'bg-type-anime text-type-anime-ink',
  drama: 'bg-type-drama text-type-drama-ink',
}

export default function ItemRow({
  item,
  onUpdated,
}: {
  item: ItemWithRecord
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const record = item.records?.[0] ?? null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 overflow-hidden rounded-xl border border-ink/10 bg-white p-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {/* サムネイル */}
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/5">
          {item.thumbnail_url ? (
            <Image src={item.thumbnail_url} alt={item.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-ink/30">
              No img
            </div>
          )}
        </div>

        {/* テキスト情報 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${typeClass[item.type]}`}
            >
              {typeLabel[item.type]}
            </span>
            {record?.rating != null && (
              <span className="text-[11px] text-amber-400">
                {'★'.repeat(record.rating)}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-medium">{item.title}</p>
          {item.creator && (
            <p className="truncate text-xs text-ink/50">{item.creator}</p>
          )}
          {record?.completed_date && (
            <p className="text-[11px] text-ink/40">{record.completed_date}</p>
          )}
        </div>

        {/* 右矢印 */}
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4 shrink-0 text-ink/20"
        >
          <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ItemDetailModal
          item={item}
          onClose={() => setOpen(false)}
          onUpdated={() => {
            setOpen(false)
            onUpdated()
          }}
        />
      )}
    </>
  )
}