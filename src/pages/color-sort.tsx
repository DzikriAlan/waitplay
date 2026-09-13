import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import ColorSortPlay from "@/features/color-sort/components/ColorSortPlay";

const DESCRIPTION = getGameDescription("color-sort");

const ColorSort: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Color Sort 3D — Free Online Puzzle Game | Waitplay"
        description={DESCRIPTION}
        path="/color-sort"
        jsonLd={getGameJsonLd("color-sort", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <ColorSortPlay />
    </>
  );
};

export default ColorSort;
