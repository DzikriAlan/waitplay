import type { NextPage } from "next";
import Head from "next/head";
import PageSeo from "@/shared/components/reusable/PageSeo";
import { useRouter } from "next/router";
import UnoRoomPlay from "@/features/uno/components/UnoRoomPlay";

const UnoRoom: NextPage = () => {
  const router = useRouter();
  const code = String(router.query.code ?? "").toUpperCase();

  return (
    <>
      <PageSeo title="UNO Online | Waitplay" description="Join a private UNO room with friends via an invite link." path="/uno" isNoIndex />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>
      {code ? <UnoRoomPlay code={code} /> : null}
    </>
  );
};

export default UnoRoom;
