import type { Item } from '@/types/item'
import ItemCard from './ItemCard'

export default function ItemList({
  items,
  emptyMessage,
}: {
  items: Item[]
  emptyMessage: string
}) {
  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-ink/40">{emptyMessage}</p>
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  )
}
