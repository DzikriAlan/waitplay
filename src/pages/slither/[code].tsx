import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { useRouter } from "next/router";
import SlitherPlay from "@/features/slither/components/SlitherPlay";

const SlitherRoom: NextPage = () => {
  const router = useRouter();
  const code = typeof router.query.code === "string" ? router.query.code : "";

  return (
    <>
      <PageSeo title="Slither 3D Online | Waitplay" description="Join a private Slither 3D room with friends via an invite link." path="/slither" isNoIndex />
      <Head>
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
