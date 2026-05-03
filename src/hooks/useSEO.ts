import { useEffect } from 'react'

interface SEOConfig {
  title: string
  description: string
  keywords?: string
  canonical?: string
  ogImage?: string
}

const DEFAULT_OG_IMAGE = 'https://medcannlab.com.br/brain.png'

/**
 * Atualiza dinamicamente os meta tags da página (title, description, OG, canonical).
 * Restaura defaults do index.html quando o componente desmonta.
 *
 * Funciona client-side (SPA). Google bot moderno (>2019) executa JS e captura.
 */
const setMetaTag = (selector: string, attr: string, value: string) => {
  let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null
  if (!el) {
    const tagName = selector.startsWith('link') ? 'link' : 'meta'
    el = document.createElement(tagName)
    if (tagName === 'meta') {
      const match = selector.match(/\[(name|property)="([^"]+)"\]/)
      if (match) (el as HTMLMetaElement).setAttribute(match[1], match[2])
    } else if (tagName === 'link') {
      const match = selector.match(/\[rel="([^"]+)"\]/)
      if (match) (el as HTMLLinkElement).setAttribute('rel', match[1])
    }
    document.head.appendChild(el)
  }
  if (el instanceof HTMLMetaElement) el.content = value
  else if (el instanceof HTMLLinkElement) el.href = value
}

export const useSEO = ({ title, description, keywords, canonical, ogImage }: SEOConfig) => {
  useEffect(() => {
    const previousTitle = document.title
    const previousDescription =
      (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content ?? ''

    document.title = title
    setMetaTag('meta[name="description"]', 'content', description)
    if (keywords) setMetaTag('meta[name="keywords"]', 'content', keywords)

    setMetaTag('meta[property="og:title"]', 'content', title)
    setMetaTag('meta[property="og:description"]', 'content', description)
    setMetaTag('meta[property="og:image"]', 'content', ogImage ?? DEFAULT_OG_IMAGE)
    if (canonical) {
      setMetaTag('meta[property="og:url"]', 'content', canonical)
      setMetaTag('link[rel="canonical"]', 'href', canonical)
    }

    setMetaTag('meta[name="twitter:title"]', 'content', title)
    setMetaTag('meta[name="twitter:description"]', 'content', description)
    setMetaTag('meta[name="twitter:image"]', 'content', ogImage ?? DEFAULT_OG_IMAGE)

    return () => {
      document.title = previousTitle
      setMetaTag('meta[name="description"]', 'content', previousDescription)
    }
  }, [title, description, keywords, canonical, ogImage])
}
