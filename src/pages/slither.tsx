import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import SlitherPlay from "@/features/slither/components/SlitherPlay";

const DESCRIPTION = "A 3D snake game: eat glowing orbs to grow longer and play online with friends. Free in your browser.";

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
