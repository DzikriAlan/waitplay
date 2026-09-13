import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import OthelloPlay from "@/features/othello/components/OthelloPlay";

const DESCRIPTION = getGameDescription("othello");

const Othello: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Othello — Play Free Online vs Bot or Friends | Waitplay"
        description={DESCRIPTION}
        path="/othello"
        jsonLd={getGameJsonLd("othello", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <OthelloPlay />
    </>
  );
};

export default Othello;
