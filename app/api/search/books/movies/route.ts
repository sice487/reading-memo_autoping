import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json({ items: [] })
  }

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ items: [], error: 'TMDb APIキーが設定されていません' })
  }

  try {
    // 映画とTVシリーズ(アニメ・ドラマ含む)を並行して検索
    const [movieRes, tvRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=ja-JP&page=1&api_key=${apiKey}`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=ja-JP&page=1&api_key=${apiKey}`,
        { next: { revalidate: 60 } }
      ),
    ])

    const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()])

    const movies = (movieData.results ?? []).slice(0, 4).map((item: any) => ({
      id: `movie-${item.id}`,
      title: item.title ?? '',
      creator: '',
      publisher: '',
      thumbnail_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : null,
      mediaType: 'movie' as const,
    }))

    const tvShows = (tvData.results ?? []).slice(0, 4).map((item: any) => ({
      id: `tv-${item.id}`,
      title: item.name ?? '',
      creator: '',
      publisher: '',
      thumbnail_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : null,
      mediaType: 'tv' as const,
    }))

    return NextResponse.json({ items: [...movies, ...tvShows] })
  } catch (e) {
    return NextResponse.json({ items: [], error: '取得に失敗しました' }, { status: 500 })
  }
}