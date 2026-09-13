import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import TetrisPlay from "@/features/tetris/components/TetrisPlay";

const DESCRIPTION = "Stack falling blocks and clear as many lines as you can. Free to play in your browser, no sign up.";

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
