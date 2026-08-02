import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 「個人の読書ノート」をイメージした温かみのあるパレット
        paper: '#FAF7F1',
        ink: '#2B2622',
        accent: { DEFAULT: '#B5502D', dark: '#8C3D22' },
        // 種類ごとのタグ色(彩度を落として統一感を持たせる)
        'type-book': '#E7E2F5',
        'type-book-ink': '#4B3B72',
        'type-manga': '#F3DCE6',
        'type-manga-ink': '#7A3155',
        'type-movie': '#F6DCD2',
        'type-movie-ink': '#8C3D22',
        'type-anime': '#FBE8C6',
        'type-anime-ink': '#8A5A12',
        'type-drama': '#DDEADB',
        'type-drama-ink': '#2F5C36',
      },
    },
  },
  plugins: [],
}

export default config
