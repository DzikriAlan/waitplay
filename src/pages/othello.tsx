import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import OthelloPlay from "@/features/othello/components/OthelloPlay";

const DESCRIPTION = "Classic 8×8 Othello (Reversi): flank and flip discs against a bot or a friend online. Free, no sign up.";

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
