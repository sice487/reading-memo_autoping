import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json({ items: [] })
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6&langRestrict=ja${apiKey ? `&key=${apiKey}` : ''}`

  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    const data = await res.json()

    const items = (data.items ?? []).map((item: any) => ({
      id: item.id,
      title: item.volumeInfo?.title ?? '',
      creator: item.volumeInfo?.authors?.join(', ') ?? '',
      publisher: item.volumeInfo?.publisher ?? '',
      thumbnail_url:
        item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null,
    }))

    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ items: [], error: '取得に失敗しました' }, { status: 500 })
  }
}