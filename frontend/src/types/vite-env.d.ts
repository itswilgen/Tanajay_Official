/// <reference types="vite/client" />

/**
 * The build-time configuration, declared rather than left to `vite/client`'s
 * `[key: string]: any` index signature — which types every misspelling as
 * `any` and so lets `VITE_API_ULR` through the compiler and out to
 * production, where it reads `undefined` and the site silently falls back to
 * localhost. There is one variable and the whole deployment hangs off it, so
 * it is worth naming.
 *
 * Optional on purpose: it genuinely can be absent (a fresh clone with no
 * .env.local), and src/api.ts has the local default for exactly that case.
 * Marking it required here would only move the lie into the type system.
 */
interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
