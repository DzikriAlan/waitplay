import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { useRouter } from "next/router";
import ChessRoomPlay from "@/features/chess/components/ChessRoomPlay";

const ChessRoom: NextPage = () => {
  const router = useRouter();
  const code = String(router.query.code ?? "").toUpperCase();

  return (
    <>
      <PageSeo title="Chess Online | Waitplay" description="Join a private Chess room with friends via an invite link." path="/chess" isNoIndex />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      {code ? <ChessRoomPlay code={code} /> : null}
    </>
  );
};

export default ChessRoom;
