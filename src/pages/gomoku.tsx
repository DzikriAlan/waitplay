import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import GomokuPlay from "@/features/gomoku/components/GomokuPlay";

const DESCRIPTION = "Get five in a row on a 15×15 board against a bot or invite a friend online. Free, no sign up.";

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
