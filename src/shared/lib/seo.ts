import { STORE_GAMES } from '@/features/store/static/storeGames'

export const SITE_NAME = 'Waitplay'

// Domain produksi dibaca dari env supaya canonical, sitemap, dan og:url selalu absolut.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002').replace(/\/+$/, '')

export const SITE_IMAGE = '/waitplay-mark.png'

export const getAbsoluteUrl = (path: string) => `${SITE_URL}${path}`

export const getIndexablePaths = () => ['/', ...STORE_GAMES.filter((game) => game.isAvailable).map((game) => game.path)]

const getGame = (gameId: string) => STORE_GAMES.find((game) => game.id === gameId)

export const getGameJsonLd = (gameId: string, description: string) => {
  const game = getGame(gameId)
  if (!game) return undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description,
    url: getAbsoluteUrl(game.path),
    image: getAbsoluteUrl(SITE_IMAGE),
    genre: game.categoryLabel,
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    playMode: game.mode === 'solo' ? 'SinglePlayer' : ['SinglePlayer', 'MultiPlayer'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  }
}

export const getHomeJsonLd = (description: string) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      alternateName: 'Waitplay Game Collection',
      url: SITE_URL,
      description,
    },
    {
      '@type': 'ItemList',
      name: 'Waitplay Game Collection',
      itemListElement: STORE_GAMES.filter((game) => game.isAvailable).map((game, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: game.name,
        url: getAbsoluteUrl(game.path),
      })),
    },
  ],
})
