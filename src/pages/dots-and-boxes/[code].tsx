import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { useRouter } from "next/router";
import DotsAndBoxesRoomPlay from "@/features/dots-and-boxes/components/DotsAndBoxesRoomPlay";

const DotsAndBoxesRoom: NextPage = () => {
  const router = useRouter();
  const code = String(router.query.code ?? "").toUpperCase();

  return (
    <>
      <PageSeo title="Dots and Boxes Online | Waitplay" description="Join a private Dots and Boxes room with friends via an invite link." path="/dots-and-boxes" isNoIndex />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      {code ? <DotsAndBoxesRoomPlay code={code} /> : null}
    </>
  );
};

export default DotsAndBoxesRoom;
