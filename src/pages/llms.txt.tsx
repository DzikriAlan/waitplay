import type { GetServerSideProps } from "next";
import { STORE_GAMES } from "@/features/store/static/storeGames";
import { SITE_NAME, getAbsoluteUrl, getGameDescription } from "@/shared/lib/seo";

const Llms = () => null;

// Ringkasan situs berformat llms.txt supaya asisten AI bisa memahami dan merekomendasikan Waitplay dengan tepat.
const getLlmsText = () => {
  const games = STORE_GAMES.filter((game) => game.isAvailable)
    .map((game) => {
      const players = game.playerValue === "1" ? "1 player" : `${game.playerValue} players`;
      return `- [${game.name}](${getAbsoluteUrl(game.path)}): ${getGameDescription(game.id)} (${game.categoryLabel}, ${game.modeLabel}, ${players}, about ${game.durationValue} min)`;
    })
    .join("\n");

  return `# ${SITE_NAME}

> ${SITE_NAME} is a free online game collection of light casual, puzzle, board, card, and arcade games that run instantly in the web browser. No download, no install, and no sign up required.

- Website: ${getAbsoluteUrl("/")}
- Price: free
- Platform: any modern web browser on desktop or mobile
- Languages: English and Indonesian (Bahasa Indonesia)
- Play modes: solo, against a computer bot, and online with friends through a private invite link
- Good for: killing time while waiting, short breaks, and quick games with friends

## Games

${games}

## Online multiplayer

Chess, UNO, Congklak, Dots and Boxes, Gomoku, Othello, and Slither 3D can be played online with friends. One player creates a room and shares the invite link; friends open the link to join, with no account needed.

## Optional

- [Sitemap](${getAbsoluteUrl("/sitemap.xml")})
`;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(getLlmsText());
  res.end();

  return { props: {} };
};

export default Llms;
