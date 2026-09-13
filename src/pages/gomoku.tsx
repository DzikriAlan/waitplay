import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import GomokuPlay from "@/features/gomoku/components/GomokuPlay";

const DESCRIPTION = getGameDescription("gomoku");

const Gomoku: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Gomoku — Five in a Row Online | Waitplay"
        description={DESCRIPTION}
        path="/gomoku"
        jsonLd={getGameJsonLd("gomoku", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <GomokuPlay />
    </>
  );
};

export default Gomoku;
