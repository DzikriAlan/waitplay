import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import RubikPlay from "@/features/rubik/components/RubikPlay";

const DESCRIPTION = getGameDescription("rubik");

const Rubik: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Rubik 3D — Online Rubik's Cube Simulator | Waitplay"
        description={DESCRIPTION}
        path="/rubik"
        jsonLd={getGameJsonLd("rubik", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <RubikPlay />
    </>
  );
};

export default Rubik;
