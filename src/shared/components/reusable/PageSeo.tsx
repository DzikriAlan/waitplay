import Head from 'next/head'
import { SITE_IMAGE, SITE_NAME, getAbsoluteUrl } from '@/shared/lib/seo'

interface Props {
  title: string
  description?: string
  path: string
  isNoIndex?: boolean
  jsonLd?: Record<string, unknown>
}

// Meta SEO dikumpulkan di satu tempat supaya setiap halaman konsisten di mata mesin pencari.
export default function PageSeo({ title, description, path, isNoIndex = false, jsonLd }: Props) {
  const url = getAbsoluteUrl(path)
  const image = getAbsoluteUrl(SITE_IMAGE)

  return (
    <Head>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      {isNoIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <link rel="canonical" href={url} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:title" content={title} />
          {description ? <meta property="og:description" content={description} /> : null}
          <meta property="og:url" content={url} />
          <meta property="og:image" content={image} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={title} />
          {description ? <meta name="twitter:description" content={description} /> : null}
          <meta name="twitter:image" content={image} />
        </>
      )}
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
    </Head>
  )
}
