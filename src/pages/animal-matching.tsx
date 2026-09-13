import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import AnimalMatchingPlay from "@/features/animal-matching/components/AnimalMatchingPlay";

const DESCRIPTION = "Match identical animal tiles connected by a path with at most two turns. Free to play in your browser, no sign up.";

const AnimalMatching: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Animal Matching — Free Online Puzzle Game | Waitplay"
        description={DESCRIPTION}
        path="/animal-matching"
        jsonLd={getGameJsonLd("animal-matching", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <AnimalMatchingPlay />
    </>
  );
};

export default AnimalMatching;
