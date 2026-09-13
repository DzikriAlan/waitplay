import type { GetServerSideProps } from "next";
import { getAbsoluteUrl, getIndexablePaths } from "@/shared/lib/seo";

const Sitemap = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const urls = getIndexablePaths()
    .map(
      (path) =>
        `<url><loc>${getAbsoluteUrl(path)}</loc><changefreq>weekly</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`
    )
    .join("");

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  res.end();

  return { props: {} };
};

export default Sitemap;
