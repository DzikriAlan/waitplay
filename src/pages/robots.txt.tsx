import type { GetServerSideProps } from "next";
import { getAbsoluteUrl } from "@/shared/lib/seo";

// Crawler mesin pencari dan asisten AI disebut eksplisit supaya Waitplay bisa dikutip oleh ChatGPT, Claude, Perplexity, Gemini, dan sejenisnya.
const AGENTS = [
  "*",
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "DuckAssistBot",
  "Amazonbot",
  "meta-externalagent",
  "MistralAI-User",
  "CCBot",
];

const Robots = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const agents = AGENTS.map((agent) => `User-agent: ${agent}`).join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(`${agents}\nAllow: /\nDisallow: /api/\n\nSitemap: ${getAbsoluteUrl("/sitemap.xml")}\n`);
  res.end();

  return { props: {} };
};

export default Robots;
