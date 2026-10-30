/**
 * Props HandleInertiaRequests shares with every page. Keep this in step with
 * the `share()` method in app/Http/Middleware/HandleInertiaRequests.php.
 */
declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            city: Record<string, unknown>;
            [key: string]: unknown;
        };
    }
}
