import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import SlitherPlay from "@/features/slither/components/SlitherPlay";

const SlitherRoom: NextPage = () => {
  const router = useRouter();
  const code = typeof router.query.code === "string" ? router.query.code : "";

  return (
    <>
      <Head>
        <title>Slither 3D</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      <SlitherPlay initialRoom={code} />
    </>
  );
};

export default SlitherRoom;
