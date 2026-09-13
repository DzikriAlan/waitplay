import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Search butuh favicon persegi kelipatan 48px, jadi ukuran kecil dan besar disediakan sekaligus. */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0a0a0b" />
        <meta name="application-name" content="Waitplay" />
        <meta name="apple-mobile-web-app-title" content="Waitplay" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
