import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameDescription, getGameJsonLd } from "@/shared/lib/seo";
import CongklakPlay from "@/features/congklak/components/CongklakPlay";

const DESCRIPTION = getGameDescription("congklak");

const Congklak: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Congklak Online — Traditional Board Game | Waitplay"
        description={DESCRIPTION}
        path="/congklak"
        jsonLd={getGameJsonLd("congklak", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <CongklakPlay />
    </>
  );
};

export default Congklak;
