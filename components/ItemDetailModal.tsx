'use client'

import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { ItemWithRecord, ItemType } from '@/types/item'
import StarRating from './StarRating'
import TagInput from './TagInput'

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

// タグ名のリストをDBに保存してrecord_tagsを更新する共通関数
async function syncTags(recordId: string, tagNames: string[]) {
  const tagIds: string[] = []

  for (const name of tagNames) {
    // maybeSingle()を使用: データなし=null、エラー時のみthrow
    const { data: existing } = await supabaseBrowser
      .from('tags')
      .select('id')
      .eq('name', name)
      .maybeSingle()

    if (existing) {
      tagIds.push(existing.id)
    } else {
      const { data: created } = await supabaseBrowser
        .from('tags')
        .insert({ name })
        .select('id')
        .maybeSingle()
      if (created) tagIds.push(created.id)
    }
  }

  // 既存のrecord_tagsを削除して付け直す
  await supabaseBrowser.from('record_tags').delete().eq('record_id', recordId)

  if (tagIds.length > 0) {
    await supabaseBrowser.from('record_tags').insert(
      tagIds.map((tag_id) => ({ record_id: recordId, tag_id }))
    )
  }
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
  const [allTagSuggestions, setAllTagSuggestions] = useState<string[]>([])

  // 既存レコード
  const record = item.records?.[0] ?? null

  // ウィッシュリスト→完了にする用フォーム
  const [completedDate, setCompletedDate] = useState(todayString())
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // 完了済みアイテムのレコード編集/新規作成用フォーム
  const [editCompletedDate, setEditCompletedDate] = useState(
    record?.completed_date ?? todayString()
  )
  const [editRating, setEditRating] = useState<number | null>(record?.rating ?? null)
  const [editReview, setEditReview] = useState(record?.review ?? '')
  const [editTags, setEditTags] = useState<string[]>(
    record?.record_tags.map((rt) => rt.tags.name) ?? []
  )

  // タグ候補を取得
  useEffect(() => {
    supabaseBrowser
      .from('tags')
      .select('name')
      .order('name')
      .then(({ data }) => setAllTagSuggestions(data?.map((t) => t.name) ?? []))
  }, [])

  // アイテム情報の編集
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
    onUpdated()
  }

  // ウィッシュリスト→完了にする
  async function handleComplete() {
    if (!completedDate) {
      setErrorMessage('完了日を入力してください')
      return
    }
    setErrorMessage(null)
    setIsPending(true)

    const { data: newRecord, error: recordError } = await supabaseBrowser
      .from('records')
      .insert({
        item_id: item.id,
        completed_date: completedDate,
        rating,
        review: review.trim() || null,
      })
      .select('id')
      .maybeSingle()

    if (recordError || !newRecord) {
      setErrorMessage(`記録の作成に失敗しました: ${recordError?.message}`)
      setIsPending(false)
      return
    }

    await syncTags(newRecord.id, tags)

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

  // 完了済みのレコードを編集 or 新規作成
  async function handleSaveRecord() {
    setErrorMessage(null)
    setIsPending(true)

    if (record) {
      // 既存レコードを更新
      const { error } = await supabaseBrowser
        .from('records')
        .update({
          completed_date: editCompletedDate,
          rating: editRating,
          review: editReview.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id)

      if (error) {
        setErrorMessage(`記録の更新に失敗しました: ${error.message}`)
        setIsPending(false)
        return
      }

      await syncTags(record.id, editTags)
    } else {
      // recordsが存在しない場合(RegisterModalでcompletedに直接登録した場合)は新規作成
      const { data: newRecord, error: recordError } = await supabaseBrowser
        .from('records')
        .insert({
          item_id: item.id,
          completed_date: editCompletedDate,
          rating: editRating,
          review: editReview.trim() || null,
        })
        .select('id')
        .maybeSingle()

      if (recordError || !newRecord) {
        setErrorMessage(`記録の作成に失敗しました: ${recordError?.message}`)
        setIsPending(false)
        return
      }

      await syncTags(newRecord.id, editTags)
    }

    setIsPending(false)
    onUpdated()
  }

  // アイテムの削除
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
        {/* アイテム情報の編集フォーム */}
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
              <label className={labelClass}>完了日</label>
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

            <div>
              <label className={labelClass}>タグ</label>
              <TagInput tags={tags} onChange={setTags} suggestions={allTagSuggestions} />
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

        {/* 完了済みの記録を編集 or 新規作成 */}
        {item.status === 'completed' && (
          <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <p className="font-serif text-sm font-medium">
              {record ? '記録を編集' : '記録を追加'}
            </p>

            <div>
              <label className={labelClass}>完了日</label>
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

            <div>
              <label className={labelClass}>タグ</label>
              <TagInput
                tags={editTags}
                onChange={setEditTags}
                suggestions={allTagSuggestions}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveRecord}
              disabled={isPending}
              className="w-full rounded-lg bg-ink py-2 text-sm text-white disabled:opacity-50"
            >
              {isPending ? '保存中…' : record ? '記録を保存する' : '記録を追加する'}
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