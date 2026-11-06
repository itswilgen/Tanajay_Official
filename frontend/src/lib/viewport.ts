import { useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches, as React state.
 *
 * WHY THIS EXISTS WHEN THE STYLESHEET COULD DO IT
 * -----------------------------------------------
 * Almost every responsive decision on this site belongs in `site.css`, and
 * putting a breakpoint in TypeScript is normally the wrong answer — a second
 * copy of a number that has to agree with the first. This hook is for the one
 * case the stylesheet genuinely cannot reach: deciding whether a component is
 * *mounted at all*.
 *
 * `display: none` hides a thing; it does not stop it. A hidden carousel still
 * downloads its photographs and still runs its timer, which is the whole cost
 * on the one connection that cannot afford it. So the banner asks this
 * question in React and renders one arrangement or the other.
 *
 * The matching breakpoint lives in `site.css`; the caller names it and says
 * where. Keep them in step — and prefer a stylesheet rule whenever the choice
 * is only about appearance.
 *
 * `matchMedia` answers synchronously, so the first render is already correct
 * and nothing flashes the wrong layout on the way in.
 */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onChange) => {
            const mq = window.matchMedia(query);
            mq.addEventListener('change', onChange);

            return () => mq.removeEventListener('change', onChange);
        },
        () => window.matchMedia(query).matches,
        // No server render. The desktop arrangement is the one the site had
        // before this existed, so it is the safe answer if there is ever no
        // window to ask.
        () => false,
    );
}
