import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { useRouter } from "next/router";
import OthelloRoomPlay from "@/features/othello/components/OthelloRoomPlay";

const OthelloRoom: NextPage = () => {
  const router = useRouter();
  const code = String(router.query.code ?? "").toUpperCase();

  return (
    <>
      <PageSeo title="Othello Online | Waitplay" description="Join a private Othello room with friends via an invite link." path="/othello" isNoIndex />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      {code ? <OthelloRoomPlay code={code} /> : null}
    </>
  );
};

export default OthelloRoom;
