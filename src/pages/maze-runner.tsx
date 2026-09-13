import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { getGameJsonLd } from "@/shared/lib/seo";
import MazeRunnerPlay from "@/features/maze-runner/components/MazeRunnerPlay";

const DESCRIPTION = "Guide the beetle through the maze to its cave before time runs out. A free maze runner game in your browser.";

const MazeRunner: NextPage = () => {
  return (
    <>
      <PageSeo
        title="Labirin Kumbang — Free Maze Runner Game | Waitplay"
        description={DESCRIPTION}
        path="/maze-runner"
        jsonLd={getGameJsonLd("maze-runner", DESCRIPTION)}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <MazeRunnerPlay />
    </>
  );
};

export default MazeRunner;
