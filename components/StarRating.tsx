'use client'

interface StarRatingProps {
  value: number | null
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'text-base' : 'text-2xl'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`leading-none transition-colors ${sizeClass} ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:text-amber-400'
          } ${(value ?? 0) >= star ? 'text-amber-400' : 'text-ink/20'}`}
          aria-label={readonly ? undefined : `${star}星`}
        >
          ★
        </button>
      ))}
    </div>
  )
}