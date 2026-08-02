import { supabase } from '@/lib/supabase'
import type { Item } from '@/types/item'
import ItemList from '@/components/ItemList'
import RegisterModal from '@/components/RegisterModal'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'wishlist')
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="text-sm text-red-700">読み込めませんでした: {error.message}</p>
  }

  return (
    <div>
      <ItemList
        items={(data ?? []) as Item[]}
        emptyMessage="まだ何も登録されていません。気になる本や映画を登録してみましょう。"
      />
      <RegisterModal defaultStatus="wishlist" />
    </div>
  )
}
