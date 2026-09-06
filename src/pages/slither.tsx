import type { NextPage } from "next";
import Head from "next/head";
import SlitherPlay from "@/features/slither/components/SlitherPlay";

const Slither: NextPage = () => {
  return (
    <>
      <Head>
        <title>Slither 3D</title>
        <meta
          name="description"
          content="Ular tiga dimensi yang bisa makan titik cahaya untuk memanjang dan main bareng teman secara online"
        />
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
