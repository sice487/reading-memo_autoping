'use client'

import { useState } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}

export default function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('')

  const filteredSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()) && input.length > 0
  )

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-[42px] flex-wrap gap-1.5 rounded-lg border border-ink/15 bg-white p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-ink/40 hover:text-ink"
              aria-label={`${tag}を削除`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'タグを入力してEnter' : ''}
          className="min-w-[120px] flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggestions.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs hover:bg-ink/5"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}