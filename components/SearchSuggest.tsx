'use client'

import Image from 'next/image'

export interface SearchCandidate {
  id: string
  title: string
  creator: string
  publisher: string
  thumbnail_url: string | null
  mediaType?: 'movie' | 'tv'
}

export default function SearchSuggest({
  candidates,
  onSelect,
  loading,
}: {
  candidates: SearchCandidate[]
  onSelect: (candidate: SearchCandidate) => void
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="mt-1 rounded-xl border border-ink/10 bg-white p-3 text-center text-xs text-ink/40">
        検索中…
      </div>
    )
  }

  if (candidates.length === 0) return null

  return (
    <ul className="mt-1 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
      {candidates.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSelect(c)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-ink/5"
          >
            <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-ink/5">
              {c.thumbnail_url ? (
                <Image src={c.thumbnail_url} alt={c.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[8px] text-ink/30">
                  No img
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{c.title}</p>
              <p className="truncate text-xs text-ink/50">
                {[c.creator, c.publisher].filter(Boolean).join(' / ') || '—'}
              </p>
            </div>
            {c.mediaType && (
              <span className="shrink-0 text-[10px] text-ink/30">
                {c.mediaType === 'movie' ? '映画' : 'TV'}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}