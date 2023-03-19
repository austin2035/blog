import rss, { pagesGlobToRssItems } from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '../consts.js';

export async function get() {
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    items: await pagesGlobToRssItems(import.meta.glob('./**/*.md')),
    customData: `<language>zh-cn</language>`,
  });
}