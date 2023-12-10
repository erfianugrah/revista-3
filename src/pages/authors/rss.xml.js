import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
    const zeitweilig = await getCollection("authors");
    return rss({
        stylesheet: '/rss/rss.xsl',
        title: 'stoicopa',
        description: 'My personal hamster wheel.',
        site: context.site,
        items: zeitweilig.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/zeitweilig/${post.slug}/`,
            content: sanitizeHtml(parser.render(post.body)),
            ...post.data,
        })),
        customData: `<language>en-us</language>`,
    });
}

    // const short_form = await getCollection("short_form");
    // const long_form = await getCollection("long_form");
    // const zeitweilig = await getCollection("zeitweilig");
        // short_form.map((post) => ({
        //     title: post.data.title,
        //     pubDate: post.data.pubDate,
        //     description: post.data.description,
        //     link: `/short_form/${post.slug}/`,
        // })),
        // long_form.map((post) => ({
        //     title: post.data.title,
        //     pubDate: post.data.pubDate,
        //     description: post.data.description,
        //     link: `/long_form/${post.slug}/`,
        // })),
        // zeitweilig.map((post) => ({
        //     title: post.data.title,
        //     pubDate: post.data.pubDate,
        //     description: post.data.description,
        //     link: `/zeitweilig/${post.slug}/`,
        // })),