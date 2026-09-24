'use client'

import { useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { ItemStatus, ItemType } from '@/types/item'
import StarRating from './StarRating'

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

function todayString() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

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
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>(status)
  const [rating, setRating] = useState<number | null>(null)
  const [completedDate, setCompletedDate] = useState(todayString())
  const [review, setReview] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleOpen() {
    setSelectedStatus(status)
    setRating(null)
    setCompletedDate(todayString())
    setReview('')
    setErrorMessage(null)
    setOpen(true)
  }

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

    // アイテムを登録
    const { data: newItem, error: itemError } = await supabaseBrowser
      .from('items')
      .insert({
        type: formData.get('type') as ItemType,
        status: selectedStatus,
        title,
        creator: (formData.get('creator') as string)?.trim() || null,
        publisher: (formData.get('publisher') as string)?.trim() || null,
        thumbnail_url: (formData.get('thumbnail_url') as string)?.trim() || null,
        external_source: 'manual',
      })
      .select('id')
      .maybeSingle()

    if (itemError || !newItem) {
      setErrorMessage(`保存できませんでした: ${itemError?.message}`)
      setIsPending(false)
      return
    }

    // completedの場合はrecordも同時に作成
    if (selectedStatus === 'completed') {
      const { error: recordError } = await supabaseBrowser.from('records').insert({
        item_id: newItem.id,
        completed_date: completedDate,
        rating,
        review: review.trim() || null,
      })

      if (recordError) {
        setErrorMessage(`記録の保存に失敗しました: ${recordError.message}`)
        setIsPending(false)
        return
      }
    }

    setIsPending(false)
    formRef.current?.reset()
    setOpen(false)
    onSaved()
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl leading-none text-white shadow-md transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="新規登録"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="my-auto w-full max-w-md rounded-t-2xl bg-paper p-5 sm:rounded-2xl"
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
                <select
                  name="status"
                  required
                  className={inputClass}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ItemStatus)}
                >
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

              {/* 記録済みを選択した場合のみ表示 */}
              {selectedStatus === 'completed' && (
                <>
                  <div className="border-t border-ink/10 pt-3">
                    <p className="mb-3 font-serif text-sm font-medium">記録</p>
                  </div>

                  <div>
                    <label className={labelClass}>読了日 / 視聴日</label>
                    <input
                      type="date"
                      value={completedDate}
                      onChange={(e) => setCompletedDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>評価</label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>

                  <div>
                    <label className={labelClass}>感想</label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={3}
                      placeholder="感想を入力…"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {errorMessage && <p className="text-xs text-red-700">{errorMessage}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-ink/15 py-2 text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-accent py-2 text-sm text-white disabled:opacity-50"
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