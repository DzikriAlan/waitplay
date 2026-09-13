import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getHomeJsonLd } from "@/shared/lib/seo";
import StorePlay from "@/features/store/components/StorePlay";

const DESCRIPTION =
  "Waitplay is a free game collection you can play instantly in your browser: Chess, UNO, Tetris, 2048, Congklak, Othello, Gomoku, Rubik 3D and more. No download, no sign up.";

const Home: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Waitplay Game Collection — Free Online Games, No Sign Up"
        description={DESCRIPTION}
        path="/"
        jsonLd={getHomeJsonLd(DESCRIPTION)}
      />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <StorePlay />
    </>
  );
};

export default Home;
