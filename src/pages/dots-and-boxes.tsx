import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import DotsAndBoxesPlay from "@/features/dots-and-boxes/components/DotsAndBoxesPlay";

const DESCRIPTION = getGameDescription("dots-and-boxes");

const DotsAndBoxes: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Dots and Boxes — Play Free Online | Waitplay"
        description={DESCRIPTION}
        path="/dots-and-boxes"
        jsonLd={getGameJsonLd("dots-and-boxes", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <DotsAndBoxesPlay />
    </>
  );
};

export default DotsAndBoxes;
