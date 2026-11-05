import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/styles/app.css';

/**
 * The front end's entry point.
 *
 * It replaces `createInertiaApp`, which used to take the page component and
 * its props from the server-rendered document. There is no server-rendered
 * document now: the shell is index.html, and App fetches the page's contents
 * from the API.
 *
 * The stylesheet is imported here rather than linked from index.html so Vite
 * hashes and inlines it — a <link> to a raw CSS file would be unhashed, and an
 * edit to the tokens would be served stale from the CDN's cache.
 */
const host = document.getElementById('app');

if (!host) {
    // Unreachable unless index.html has been edited to drop the mount point.
    // It fails loudly here rather than leaving a blank white page with a
    // console warning nobody opens.
    throw new Error(
        'The mount point #app is missing from the document. Check index.html.',
    );
}

createRoot(host).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
