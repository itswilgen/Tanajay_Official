import { useEffect } from 'react';

/**
 * Keep the document's title and description in step with the city record.
 *
 * This replaces Inertia's `<Head>`. Both titles and both descriptions now
 * exist in two places — written statically into index.html, and set here once
 * the city record arrives — and that is on purpose, not a duplication left by
 * the split:
 *
 *   index.html is what a crawler, a link preview and a browser tab read
 *   before any JavaScript has run. On a client-rendered page that is the only
 *   copy most of them will ever see.
 *
 *   This effect is what keeps them true. The city's legal name and tagline
 *   are published through config/portal.php, so the City Information Office
 *   can correct them; if it does, the static copy is stale until someone
 *   rebuilds, and this one is right on the next page load.
 *
 * So index.html holds the city's name as it stands today and this holds it as
 * the record says it is. When they disagree, the record wins and index.html
 * wants updating.
 */
export function useDocumentMeta({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    useEffect(() => {
        if (title) document.title = title;
    }, [title]);

    useEffect(() => {
        if (!description) return;

        // The tag is in index.html, so this is an update in the ordinary case.
        // It is still created if absent rather than skipped: a description
        // that silently stops being set is the kind of regression nobody sees
        // until a link is shared somewhere.
        let tag = document.head.querySelector<HTMLMetaElement>(
            'meta[name="description"]',
        );

        if (!tag) {
            tag = document.createElement('meta');
            tag.name = 'description';
            document.head.append(tag);
        }

        tag.content = description;
    }, [description]);
}
