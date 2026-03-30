import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoMetaProps = {
  title: string;
  description: string;
  robots?: string;
  canonicalPath?: string;
};

const DEFAULT_SITE_NAME = 'UR Academic Resource Hub';
const DEFAULT_SITE_URL = 'https://paperhubur.vercel.app';

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, rel: string, href: string) {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  element.rel = rel;
  element.href = href;
}

export default function SeoMeta({ title, description, robots = 'index,follow', canonicalPath }: SeoMetaProps) {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = `${DEFAULT_SITE_URL}${canonicalPath || location.pathname}`;
    const fullTitle = title.includes(DEFAULT_SITE_NAME) ? title : `${title} | ${DEFAULT_SITE_NAME}`;

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertLink('link[rel="canonical"]', 'canonical', canonicalUrl);
  }, [canonicalPath, description, location.pathname, robots, title]);

  return null;
}
