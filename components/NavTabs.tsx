'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/wishlist', label: '未読・未視聴' },
  { href: '/completed', label: '記録済み' },
]

export default function NavTabs() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 py-3 text-center text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                active
                  ? 'border-t-2 border-accent font-medium text-accent'
                  : 'border-t-2 border-transparent text-ink/50'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
