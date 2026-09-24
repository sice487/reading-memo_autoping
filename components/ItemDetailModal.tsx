'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { ItemWithRecord, ItemType } from '@/types/item'
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

export default function ItemDetailModal({
  item,
  onClose,
  onUpdated,
}: {
  item: ItemWithRecord
  onClose: () => void
  onUpdated: () => void
}) {
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const record = item.records?.[0] ?? null

  // アイテム情報
  const [type, setType] = useState<ItemType>(item.type)
  const [title, setTitle] = useState(item.title)
  const [creator, setCreator] = useState(item.creator ?? '')
  const [publisher, setPublisher] = useState(item.publisher ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(item.thumbnail_url ?? '')

  // 記録情報
  const [editCompletedDate, setEditCompletedDate] = useState(
    record?.completed_date ?? todayString()
  )
  const [editRating, setEditRating] = useState<number | null>(record?.rating ?? null)
  const [editReview, setEditReview] = useState(record?.review ?? '')

  // ウィッシュリスト→完了にする用
  const [completedDate, setCompletedDate] = useState(todayString())
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState('')

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('タイトルを入力してください')
      return
    }
    setErrorMessage(null)
    setIsPending(true)

    // アイテム情報を更新
    const { error: itemError } = await supabaseBrowser
      .from('items')
      .update({
        type,
        title: title.trim(),
        creator: creator.trim() || null,
        publisher: publisher.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    if (itemError) {
      setErrorMessage(`更新できませんでした: ${itemError.message}`)
      setIsPending(false)
      return
    }

    // 記録済みの場合は記録も更新 or 新規作成
    if (item.status === 'completed') {
      if (record) {
        const { error: recError } = await supabaseBrowser
          .from('records')
          .update({
            completed_date: editCompletedDate,
            rating: editRating,
            review: editReview.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id)

        if (recError) {
          setErrorMessage(`記録の更新に失敗しました: ${recError.message}`)
          setIsPending(false)
          return
        }
      } else {
        const { error: recError } = await supabaseBrowser.from('records').insert({
          item_id: item.id,
          completed_date: editCompletedDate,
          rating: editRating,
          review: editReview.trim() || null,
        })

        if (recError) {
          setErrorMessage(`記録の作成に失敗しました: ${recError.message}`)
          setIsPending(false)
          return
        }
      }
    }

    setIsPending(false)
    onUpdated()
  }

  async function handleComplete() {
    if (!completedDate) {
      setErrorMessage('完了日を入力してください')
      return
    }
    setErrorMessage(null)
    setIsPending(true)

    const { error: recordError } = await supabaseBrowser.from('records').insert({
      item_id: item.id,
      completed_date: completedDate,
      rating,
      review: review.trim() || null,
    })

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
    onUpdated()
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
    onUpdated()
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-md rounded-t-2xl bg-paper p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-serif text-base font-medium">編集</h2>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className={labelClass}>種類</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              required
              className={inputClass}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>タイトル *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>作者 / 監督</label>
            <input
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>出版社 / 制作会社</label>
            <input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>サムネイルURL</label>
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* 記録済みの場合のみ記録情報を表示 */}
          {item.status === 'completed' && (
            <>
              <div className="border-t border-ink/10 pt-3">
                <p className="mb-3 font-serif text-sm font-medium">
                  {record ? '記録' : '記録を追加'}
                </p>
              </div>

              <div>
                <label className={labelClass}>読了日 / 視聴日</label>
                <input
                  type="date"
                  value={editCompletedDate}
                  onChange={(e) => setEditCompletedDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>評価</label>
                <StarRating value={editRating} onChange={setEditRating} />
              </div>

              <div>
                <label className={labelClass}>感想</label>
                <textarea
                  value={editReview}
                  onChange={(e) => setEditReview(e.target.value)}
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
              onClick={onClose}
              className="flex-1 rounded-lg border border-ink/15 py-2 text-sm"
            >
              閉じる
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

        {/* ウィッシュリスト→完了にする */}
        {item.status === 'wishlist' && (
          <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <p className="font-serif text-sm font-medium">完了にする</p>

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

            <button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              className="w-full rounded-lg bg-ink py-2 text-sm text-white disabled:opacity-50"
            >
              {isPending ? '保存中…' : '完了にする'}
            </button>
          </div>
        )}

        {/* 削除 */}
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