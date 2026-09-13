import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import UnoPlay from "@/features/uno/components/UnoPlay";

const DESCRIPTION = getGameDescription("uno");

const Uno: NextPage = () => {
  return (
    <>
      <PageSeo
        title="UNO Online — Free Card Game vs Bot or Friends | Waitplay"
        description={DESCRIPTION}
        path="/uno"
        jsonLd={getGameJsonLd("uno", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <UnoPlay />
    </>
  );
};

export default Uno;
