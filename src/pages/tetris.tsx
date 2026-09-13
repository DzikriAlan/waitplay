import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import TetrisPlay from "@/features/tetris/components/TetrisPlay";

const DESCRIPTION = getGameDescription("tetris");

const Tetris: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Tetris — Play Free Online | Waitplay"
        description={DESCRIPTION}
        path="/tetris"
        jsonLd={getGameJsonLd("tetris", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <TetrisPlay />
    </>
  );
};

export default Tetris;
