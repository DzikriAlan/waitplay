import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import SlitherPlay from "@/features/slither/components/SlitherPlay";

const DESCRIPTION = getGameDescription("slither");

const Slither: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Slither 3D — Multiplayer Snake Game | Waitplay"
        description={DESCRIPTION}
        path="/slither"
        jsonLd={getGameJsonLd("slither", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <SlitherPlay />
    </>
  );
};

export default Slither;
