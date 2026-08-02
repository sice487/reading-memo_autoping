import type { Metadata } from 'next'
import './globals.css'
import NavTabs from '@/components/NavTabs'

export const metadata: Metadata = {
  title: '読書・視聴メモ',
  description: '個人用の読書・映像作品メモアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <div className="mx-auto max-w-2xl pb-28">
          <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur">
            <h1 className="font-serif text-lg font-medium tracking-wide">読書・視聴メモ</h1>
          </header>
          <main className="px-4 py-4">{children}</main>
        </div>
        <NavTabs />
      </body>
    </html>
  )
}
