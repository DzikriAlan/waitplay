import { STORE_GAMES } from '@/features/store/static/storeGames'

export const SITE_NAME = 'Waitplay'

// Domain produksi jadi bawaan supaya canonical, sitemap, dan og:url tetap benar walau env belum diisi.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.waitplay.space').replace(/\/+$/, '')

export const SITE_IMAGE = '/waitplay-mark.png'

export const getAbsoluteUrl = (path: string) => `${SITE_URL}${path}`

export const getIndexablePaths = () => ['/', ...STORE_GAMES.filter((game) => game.isAvailable).map((game) => game.path)]

// Satu sumber deskripsi game untuk meta halaman, structured data, dan llms.txt.
const GAME_DESCRIPTIONS: Record<string, string> = {
  'animal-matching': 'Match identical animal tiles connected by a path with at most two turns. Free to play in your browser, no sign up.',
  'chess': 'Play classic chess online against the Stockfish engine or invite a friend with a link. Free, in the browser, no sign up.',
  'color-sort': 'Sort the colors into matching tubes in a 3D puzzle with endless levels. Free to play in your browser.',
  'congklak': 'Play congklak (mancala) against a bot or with a friend online, with capture and extra-turn rules. Free, no sign up.',
  'dots-and-boxes': 'Draw lines between dots and claim boxes against a bot or a friend online. Free to play in your browser.',
  'game-2048': 'Slide the board to merge numbers until you reach the 2048 tile. Free to play in your browser, no download.',
  'gomoku': 'Get five in a row on a 15×15 board against a bot or invite a friend online. Free, no sign up.',
  'maze-runner': 'Guide the beetle through the maze to its cave before time runs out. A free maze runner game in your browser.',
  'othello': 'Classic 8×8 Othello (Reversi): flank and flip discs against a bot or a friend online. Free, no sign up.',
  'rubik': 'Turn and solve a 3D Rubik\'s cube right in your browser. Free, no download.',
  'slither': 'A 3D snake game: eat glowing orbs to grow longer and play online with friends. Free in your browser.',
  'tetris': 'Stack falling blocks and clear as many lines as you can. Free to play in your browser, no sign up.',
  'uno': 'Play classic UNO against bots or with friends online, with a neo brutalism look. Free, no sign up.',
}

export const getGameDescription = (gameId: string) => GAME_DESCRIPTIONS[gameId] ?? ''

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
