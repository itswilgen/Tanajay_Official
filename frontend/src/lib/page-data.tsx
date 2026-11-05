import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { HomePayload } from '@/api';

/**
 * What this page was sent.
 *
 * This replaces Inertia's `usePage().props`, and it is deliberately the same
 * shape of thing: one object, reachable from anywhere in the tree, holding
 * the whole document the server sent. The header's search index and the
 * footer's section list both need to know what the page carries without
 * having it threaded down through every component between them and the
 * top — that was true under Inertia and it is still true.
 *
 * Nullable, for the same reason `useCity` has a fallback: the chrome has to
 * stay renderable before the fetch has answered and in a component test that
 * mounts the header on its own. Consumers read it defensively.
 */
const PageDataContext = createContext<HomePayload | null>(null);

export function PageDataProvider({
    data,
    children,
}: {
    data: HomePayload;
    children: ReactNode;
}) {
    return (
        <PageDataContext.Provider value={data}>
            {children}
        </PageDataContext.Provider>
    );
}

/** The whole payload, or null before it has arrived. */
export function usePageData(): HomePayload | null {
    return useContext(PageDataContext);
}
