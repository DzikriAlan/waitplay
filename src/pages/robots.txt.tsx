import type { GetServerSideProps } from "next";
import { getAbsoluteUrl } from "@/shared/lib/seo";

const Robots = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${getAbsoluteUrl("/sitemap.xml")}\n`);
  res.end();

  return { props: {} };
};

export default Robots;
