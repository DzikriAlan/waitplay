import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { useRouter } from "next/router";
import GomokuRoomPlay from "@/features/gomoku/components/GomokuRoomPlay";

const GomokuRoom: NextPage = () => {
  const router = useRouter();
  const code = String(router.query.code ?? "").toUpperCase();

  return (
    <>
      <PageSeo title="Gomoku Online | Waitplay" description="Join a private Gomoku room with friends via an invite link." path="/gomoku" isNoIndex />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      {code ? <GomokuRoomPlay code={code} /> : null}
    </>
  );
};

export default GomokuRoom;
