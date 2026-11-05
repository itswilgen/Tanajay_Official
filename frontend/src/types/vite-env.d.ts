/// <reference types="vite/client" />

/**
 * The build-time configuration, declared rather than left to `vite/client`'s
 * `[key: string]: any` index signature — which types every misspelling as
 * `any` and so lets `VITE_API_ULR` through the compiler and out to
 * production, where it reads `undefined` and the site silently falls back to
 * localhost. Two variables carry the whole deployment, so they are worth
 * naming.
 *
 * Both optional on purpose: they genuinely can be absent (a fresh clone with
 * no .env.local), and src/api.ts has a default for each. Marking either
 * required here would only move the lie into the type system.
 */
interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    /** `'1'` builds the demonstration — see the note in src/api.ts. */
    readonly VITE_DEMO?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
