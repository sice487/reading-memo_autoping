'use client'

import { useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { ItemStatus, ItemType } from '@/types/item'

const typeOptions: { value: ItemType; label: string }[] = [
  { value: 'book', label: '本' },
  { value: 'manga', label: '漫画' },
  { value: 'movie', label: '映画' },
  { value: 'anime', label: 'アニメ' },
  { value: 'drama', label: 'ドラマ' },
]

const inputClass =
  'w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
const labelClass = 'mb-1 block text-xs text-ink/50'

export default function RegisterModal({
  status,
  onSaved,
}: {
  status: ItemStatus
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const title = (formData.get('title') as string)?.trim()

    if (!title) {
      setErrorMessage('タイトルを入力してください')
      setIsPending(false)
      return
    }

    const { error } = await supabaseBrowser.from('items').insert({
      type: formData.get('type') as ItemType,
      status: formData.get('status') as ItemStatus,
      title,
      creator: (formData.get('creator') as string)?.trim() || null,
      publisher: (formData.get('publisher') as string)?.trim() || null,
      thumbnail_url: (formData.get('thumbnail_url') as string)?.trim() || null,
      external_source: 'manual',
    })

    setIsPending(false)

    if (error) {
      setErrorMessage(`保存できませんでした: ${error.message}`)
      return
    }

    formRef.current?.reset()
    setOpen(false)
    onSaved()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl leading-none text-white shadow-md transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="新規登録"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-paper p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 font-serif text-base font-medium">新規登録</h2>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>種類</label>
                <select name="type" required className={inputClass} defaultValue="book">
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>登録先</label>
                <select name="status" required className={inputClass} defaultValue={status}>
                  <option value="wishlist">未読・未視聴(ウィッシュリスト)</option>
                  <option value="completed">記録済み(読了・視聴済み)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>タイトル *</label>
                <input name="title" required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>作者 / 監督</label>
                <input name="creator" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>出版社 / 制作会社</label>
                <input name="publisher" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>サムネイルURL</label>
                <input name="thumbnail_url" placeholder="https://..." className={inputClass} />
              </div>

              {errorMessage && <p className="text-xs text-red-700">{errorMessage}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-ink/15 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-accent py-2 text-sm text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
                >
                  {isPending ? '保存中…' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}