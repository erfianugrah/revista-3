import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const muses = await getCollection("muses");
    const short_form = await getCollection("short_form");
    const long_form = await getCollection("long_form");
    const zeitweilig = await getCollection("zeitweilig");
    return rss({
        title: 'Revista',
        description: 'Life in review. A recollection of things experienced, and things felt.',
        site: context.site,
        items: muses.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/muses/${post.slug}/`,
        })),
        short_form.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/short_form/${post.slug}/`,
        })),
        long_form.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/long_form/${post.slug}/`,
        })),
        zeitweilig.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/zeitweilig/${post.slug}/`,
        })),
        customData: `<language>en-us</language>`,
    });
}