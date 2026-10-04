import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '読書・視聴メモ',
    short_name: '読書メモ',
    description: '個人用の読書・映像作品メモアプリ',
    start_url: '/wishlist',
    display: 'standalone',
    background_color: '#FAF7F1',
    theme_color: '#B5502D',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}