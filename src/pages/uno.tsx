import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import UnoPlay from "@/features/uno/components/UnoPlay";

const DESCRIPTION = "Play classic UNO against bots or with friends online, with a neo brutalism look. Free, no sign up.";

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
