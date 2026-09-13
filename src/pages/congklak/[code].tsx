import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { useRouter } from "next/router";
import CongklakRoomPlay from "@/features/congklak/components/CongklakRoomPlay";

const CongklakRoom: NextPage = () => {
  const router = useRouter();
  const code = String(router.query.code ?? "").toUpperCase();

  return (
    <>
      <PageSeo title="Congklak Online | Waitplay" description="Join a private Congklak room with friends via an invite link." path="/congklak" isNoIndex />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      {code ? <CongklakRoomPlay code={code} /> : null}
    </>
  );
};

export default CongklakRoom;
