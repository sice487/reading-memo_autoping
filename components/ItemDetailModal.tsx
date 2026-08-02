'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Item, ItemType } from '@/types/item'

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

export default function ItemDetailModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [completedDate, setCompletedDate] = useState(todayString())
  const router = useRouter()

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
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

    const { error } = await supabaseBrowser
      .from('items')
      .update({
        type: formData.get('type') as ItemType,
        title,
        creator: (formData.get('creator') as string)?.trim() || null,
        publisher: (formData.get('publisher') as string)?.trim() || null,
        thumbnail_url: (formData.get('thumbnail_url') as string)?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    setIsPending(false)

    if (error) {
      setErrorMessage(`更新できませんでした: ${error.message}`)
      return
    }

    onClose()
    router.refresh()
  }

  async function handleDelete() {
    setErrorMessage(null)
    setIsPending(true)

    const { error } = await supabaseBrowser.from('items').delete().eq('id', item.id)

    setIsPending(false)

    if (error) {
      setErrorMessage(`削除できませんでした: ${error.message}`)
      return
    }

    onClose()
    router.refresh()
  }

  async function handleComplete() {
    if (!completedDate) {
      setErrorMessage('完了日を入力してください')
      return
    }

    setErrorMessage(null)
    setIsPending(true)

    const { error: recordError } = await supabaseBrowser
      .from('records')
      .insert({ item_id: item.id, completed_date: completedDate })

    if (recordError) {
      setErrorMessage(`記録の作成に失敗しました: ${recordError.message}`)
      setIsPending(false)
      return
    }

    const { error: itemError } = await supabaseBrowser
      .from('items')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', item.id)

    setIsPending(false)

    if (itemError) {
      setErrorMessage(`状態の更新に失敗しました: ${itemError.message}`)
      return
    }

    onClose()
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-paper p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-serif text-base font-medium">編集</h2>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className={labelClass}>種類</label>
            <select name="type" required className={inputClass} defaultValue={item.type}>
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>タイトル *</label>
            <input name="title" required defaultValue={item.title} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>作者 / 監督</label>
            <input name="creator" defaultValue={item.creator ?? ''} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>出版社 / 制作会社</label>
            <input name="publisher" defaultValue={item.publisher ?? ''} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>サムネイルURL</label>
            <input
              name="thumbnail_url"
              defaultValue={item.thumbnail_url ?? ''}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {errorMessage && <p className="text-xs text-red-700">{errorMessage}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-ink/15 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              閉じる
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

        {item.status === 'wishlist' && (
          <div className="mt-5 border-t border-ink/10 pt-4">
            <p className={labelClass}>完了にする</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleComplete}
                disabled={isPending}
                className="shrink-0 rounded-lg bg-ink px-4 text-sm text-white disabled:opacity-50"
              >
                完了にする
              </button>
            </div>
            <p className="mt-1 text-xs text-ink/40">評価・感想・タグは次のPhaseで追加できるようになります</p>
          </div>
        )}

        <div className="mt-5 border-t border-ink/10 pt-4">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-700 underline-offset-2 hover:underline"
            >
              このアイテムを削除する
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-ink/60">本当に削除しますか?元に戻せません。</p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-700 px-3 py-1 text-xs text-white disabled:opacity-50"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-ink/15 px-3 py-1 text-xs"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}