import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, lazyPlugins } from 'vite-plus';

/*
 * The public site, built as a static bundle and deployed on its own.
 *
 * Two plugins left with the Laravel split: `laravel-vite-plugin`, which wrote
 * the manifest Blade read and which also fetched the two web fonts, and
 * `@inertiajs/vite`. The entry point is now index.html like any other Vite
 * app, and the fonts are requested there — see the comment in index.html for
 * why they are linked rather than bundled.
 */
export default defineConfig({
    plugins: lazyPlugins(() => [
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        tailwindcss(),
    ]),
    resolve: {
        alias: {
            '@': new URL('./src', import.meta.url).pathname,
        },
    },
    build: {
        // The target audience includes people on older Android phones on
        // mobile data, so the bundle is kept to what those browsers can run
        // without a polyfill: baseline-widely-available is the 2022 support
        // floor, which covers every browser that can render the stylesheet's
        // `color-mix()` and `aspect-ratio` anyway.
        target: 'baseline-widely-available',
        sourcemap: true,
    },
    lint: {
        ignorePatterns: ['node_modules/**', 'dist/**', 'public/**'],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    fmt: {
        printWidth: 80,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: 'css',
        sortTailwindcss: {
            stylesheet: 'src/styles/app.css',
        },
    },
});
