import type { NextPage } from "next";
import Head from "next/head";
import PianoPlay from "@/features/piano/components/PianoPlay";

const Piano: NextPage = () => {
  return (
    <>
      <Head>
        <title>Piano</title>
        <meta name="description" content="Tekan nada yang jatuh dan mainkan lagu favoritmu di papan piano" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <PianoPlay />
    </>
  );
};

export default Piano;
