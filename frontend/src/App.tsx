import { Phone, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, fetchHome } from '@/api';
import type { ApiFailure, HomePayload } from '@/api';
import { Seal } from '@/components/site/seal';
import { PageDataProvider } from '@/lib/page-data';
import { Home } from '@/pages/home';

/**
 * The tricolour, which is markup rather than data and so is the one piece of
 * the site that can be drawn before anything has been fetched. Every state
 * below opens with it, so the page is identifiably the Republic's from the
 * first frame.
 */
function RepublicRule() {
    return (
        <div className="republic-rule" aria-hidden="true">
            <span />
            <span />
            <span />
        </div>
    );
}

/**
 * The page's shape, while the city's records are on their way.
 *
 * `role="status"` with the polite live region is how this state reaches a
 * screen reader at all — the skeleton itself is decorative and announces
 * nothing, so without the sentence a reader using one would be told the page
 * is empty and then, without warning, that it is not.
 */
function Loading() {
    return (
        <div className="boot" id="main">
            <RepublicRule />

            {/* The bar, in the city's own colour with the lockup's shapes in
                it. See boot.css for why it is not a grey block like the rest. */}
            <div className="boot-bar">
                <div className="wrap boot-bar-inner">
                    <span className="boot-seal" />
                    <span className="boot-lockup">
                        <span />
                        <span />
                        <span />
                    </span>
                </div>
            </div>

            <div className="boot-block boot-hero" />

            <div className="boot-band">
                <div className="wrap boot-band-grid">
                    {[0, 1, 2, 3].map((at) => (
                        <div className="boot-card" key={at}>
                            <div className="boot-block" />
                            <div className="boot-block boot-line" />
                            <div className="boot-block boot-line boot-line--short" />
                        </div>
                    ))}
                </div>
            </div>

            <p className="sr-only" role="status" aria-live="polite">
                Loading the City Government of Tanjay's public information.
            </p>
        </div>
    );
}

/**
 * What each failure means, said in the reader's terms.
 *
 * Four, because they call for four different actions and a single "something
 * went wrong" would send three of the four readers to the wrong one. The
 * address is printed only for `unreachable`, where it is the thing that is
 * actually wrong and the thing whoever maintains the site needs to hear.
 */
function explain(failure: ApiFailure): { heading: string; body: string } {
    switch (failure.kind) {
        case 'offline':
            return {
                heading: 'This device is not connected',
                body: 'The page cannot reach the City Government while the connection is down. Nothing is wrong with the city’s information — reconnect and load it again.',
            };
        case 'unreachable':
            return {
                heading: 'The city’s information service cannot be reached',
                body: 'The page loaded, but the service that holds the city’s notices, services and records did not answer. This is a fault at the City Government’s end, not yours. Please try again shortly.',
            };
        case 'http':
            return {
                heading: 'The city’s information service returned an error',
                body: 'The service answered but could not provide the page’s contents. It has been recorded at the City Government’s end. Please try again shortly.',
            };
        case 'malformed':
            return {
                heading: 'The city’s information could not be read',
                body: 'The service answered with something this page does not understand, which usually means a release is part-way through. Please try again shortly.',
            };
    }
}

/**
 * The city's information did not arrive.
 *
 * Deliberately not a skeleton that never fills in, and deliberately not a
 * bare error string. It carries three things: what happened in plain words,
 * a way to try again without hunting for the reload button, and the national
 * emergency line.
 *
 * That last one is the point of this screen. A municipal portal is read
 * during typhoons and after earthquakes, and the reader this state must not
 * fail is the one who opened it looking for a number to ring. 911 is the
 * national emergency hotline and the only civic fact written into this bundle
 * rather than published through the database — everything else on the site,
 * the city's own hotlines included, is the City Information Office's to
 * change, and is unreachable in exactly this state. A number that is
 * legislated nationally and cannot be withdrawn by this city is the one
 * defensible exception.
 */
function Failed({
    failure,
    onRetry,
    retrying,
}: {
    failure: ApiFailure;
    onRetry: () => void;
    retrying: boolean;
}) {
    const { heading, body } = explain(failure);

    return (
        <div className="boot" id="main">
            <RepublicRule />

            <div className="boot-failure">
                <div className="boot-failure-inner">
                    <Seal label="Official seal of the City of Tanjay" />

                    <h1>{heading}</h1>
                    <p>{body}</p>

                    {/* The address and the status, for whoever is called about
                        it. Withheld when the reader's own connection is the
                        cause, where it would only be noise. */}
                    {failure.kind !== 'offline' && (
                        <p className="boot-failure-detail">{failure.detail}</p>
                    )}

                    <div className="boot-failure-actions">
                        <button
                            type="button"
                            className="button button-primary"
                            onClick={onRetry}
                            disabled={retrying}
                            data-busy={retrying ? 'true' : undefined}
                        >
                            <RotateCw size={16} aria-hidden="true" />
                            {retrying ? 'Trying again…' : 'Try again'}
                        </button>
                    </div>

                    <div className="boot-emergency">
                        <p>In an emergency, ring the national hotline:</p>
                        <a href="tel:911">
                            <Phone size={20} aria-hidden="true" />
                            911
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

type State =
    | { status: 'loading' }
    | { status: 'ready'; data: HomePayload }
    | { status: 'failed'; failure: ApiFailure; retrying: boolean };

export function App() {
    const [state, setState] = useState<State>({ status: 'loading' });
    // Bumped by the retry button. The effect below keys off it, so a retry is
    // the same code path as the first load rather than a second one that can
    // drift away from it.
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        fetchHome(controller.signal)
            .then((data) => setState({ status: 'ready', data }))
            .catch((error: unknown) => {
                // An abort is this component unmounting, or strict mode's
                // second pass in development. Neither is a failure and
                // neither should be drawn as one.
                if (controller.signal.aborted) return;

                setState({
                    status: 'failed',
                    retrying: false,
                    failure:
                        error instanceof ApiError
                            ? error.failure
                            : {
                                  kind: 'malformed',
                                  detail:
                                      error instanceof Error
                                          ? error.message
                                          : 'The request failed.',
                              },
                });
            });

        return () => controller.abort();
    }, [attempt]);

    const retry = useCallback(() => {
        // The failed screen stays up with its button marked busy rather than
        // dropping back to the skeleton. Replacing a page the reader is
        // looking at — and has perhaps just read a phone number off — with a
        // skeleton is the one thing a retry must not do.
        setState((current) =>
            current.status === 'failed'
                ? { ...current, retrying: true }
                : current,
        );
        setAttempt((n) => n + 1);
    }, []);

    if (state.status === 'loading') return <Loading />;

    if (state.status === 'failed') {
        return (
            <Failed
                failure={state.failure}
                onRetry={retry}
                retrying={state.retrying}
            />
        );
    }

    return (
        <PageDataProvider data={state.data}>
            <Home {...state.data} />
        </PageDataProvider>
    );
}

export default App;
