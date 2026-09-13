import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import ChessPlay from "@/features/chess/components/ChessPlay";

const DESCRIPTION = "Play classic chess online against the Stockfish engine or invite a friend with a link. Free, in the browser, no sign up.";

const Chess: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Chess — Play Free vs Stockfish or Friends | Waitplay"
        description={DESCRIPTION}
        path="/chess"
        jsonLd={getGameJsonLd("chess", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <ChessPlay />
    </>
  );
};

export default Chess;
