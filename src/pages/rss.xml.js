import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const muses = await getCollection("muses");
    return rss({
        title: 'Revista',
        description: 'Life in review. A recollection of things experienced, and things felt.',
        site: context.site,
        items: posts.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/muses/${post.slug}/`,
        })),
        customData: `<language>en-us</language>`,
    });
}