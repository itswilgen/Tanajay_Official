import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'City Government of Tanjay';

/*
 * The site is a single public page, so every component renders its own chrome
 * and there is no persistent layout to resolve. Reintroduce `layout` here if a
 * section ever needs shared chrome across several pages.
 */
void createInertiaApp({
    title: (title: string) => (title ? `${title} — ${appName}` : appName),
    strictMode: true,
    progress: {
        // The seal green, so the loading bar reads as part of the site.
        color: '#00a858',
    },
});
