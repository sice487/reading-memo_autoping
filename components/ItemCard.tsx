'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ItemWithRecord } from '@/types/item'
import ItemDetailModal from './ItemDetailModal'
import StarRating from './StarRating'

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

export default function ItemCard({
  item,
  onUpdated,
}: {
  item: ItemWithRecord
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)

  const record = item.records?.[0] ?? null
  const tags = record?.record_tags.map((rt) => rt.tags.name) ?? []

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-xl border border-ink/10 bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="relative aspect-[3/4] w-full bg-ink/5">
          {item.thumbnail_url ? (
            <Image src={item.thumbnail_url} alt={item.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink/30">
              画像なし
            </div>
          )}
          <span
            className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeClass[item.type]}`}
          >
            {typeLabel[item.type]}
          </span>
          {record?.rating != null && (
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-amber-400">
              {'★'.repeat(record.rating)}
            </span>
          )}
        </div>
        <div className="p-2">
          <p className="line-clamp-2 text-sm leading-snug">{item.title}</p>
          {item.creator && (
            <p className="mt-0.5 line-clamp-1 text-xs text-ink/50">{item.creator}</p>
          )}
          {tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] text-ink/60"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] text-ink/60">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
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