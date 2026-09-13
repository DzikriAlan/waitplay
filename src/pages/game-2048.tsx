import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import Game2048Play from "@/features/game-2048/components/Game2048Play";

const DESCRIPTION = getGameDescription("game-2048");

const Game2048: NextPage = () => {
  return (
    <>
      <PageSeo
        title="2048 — Play Free Online | Waitplay"
        description={DESCRIPTION}
        path="/game-2048"
        jsonLd={getGameJsonLd("game-2048", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <Game2048Play />
    </>
  );
};

export default Game2048;
