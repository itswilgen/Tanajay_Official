import { motion, useReducedMotion } from 'motion/react';
import type { Transition, TargetAndTransition } from 'motion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

/**
 * How a block arrives.
 *
 * Each section of the landing page is given its own entrance, so that
 * scrolling the page reads as moving through a document with parts rather
 * than as one list of fading boxes. They are distinguishable but they are all
 * the same kind of gesture — short, once only, and over before a reader who is
 * scrolling fast would notice a thing. None of them moves an element further
 * than 28px or runs longer than 560ms, and none animates anything but
 * transform, opacity and (in one case) blur, so the whole page stays on the
 * compositor.
 *
 * - `rise`    the house default: a short lift and fade.
 * - `unfold`  hinged at the top edge, like a sheet being laid flat.
 * - `drift`   in from the left, for a column read left to right.
 * - `lift`    up out of a shallow blur, for a single large portrait.
 * - `cascade` a rise with a longer stagger, for a dated list.
 * - `tilt`    off the back of its own baseline, for a row of cards.
 * - `curtain` opening from the centre line, for a full-width band.
 * - `ledger`  wiped in from the left edge, for a ruled list of records.
 * - `settle`  a slight overshoot that springs into place, for small discs.
 */
export type RevealEffect =
    | 'rise'
    | 'unfold'
    | 'drift'
    | 'lift'
    | 'cascade'
    | 'tilt'
    | 'curtain'
    | 'ledger'
    | 'settle';

type Step = {
    from: TargetAndTransition;
    to: TargetAndTransition;
    transition: Transition;
    /** Seconds between siblings. The house stagger is 60ms. */
    stagger?: number;
};

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* The entrances, as data. Written out rather than composed from modifiers:
   there are nine of them and each is read far more often than it is changed,
   so a table that can be read top to bottom beats a clever constructor. */
const EFFECTS: Record<RevealEffect, Step> = {
    rise: {
        from: { opacity: 0, y: 14 },
        to: { opacity: 1, y: 0 },
        transition: { duration: 0.42, ease: EASE_OUT },
    },
    unfold: {
        from: {
            opacity: 0,
            y: 22,
            scaleY: 0.94,
            transformOrigin: 'top center',
        },
        to: { opacity: 1, y: 0, scaleY: 1 },
        transition: { duration: 0.46, ease: EASE_OUT },
    },
    drift: {
        from: { opacity: 0, x: -26 },
        to: { opacity: 1, x: 0 },
        transition: { duration: 0.48, ease: EASE_OUT },
        stagger: 0.07,
    },
    lift: {
        // The only blur on the page. It is affordable here because it runs
        // once, on one element, and resolves to `blur(0px)` — a filter left
        // standing on a large element is what makes a page feel slow.
        from: { opacity: 0, y: 24, scale: 0.96, filter: 'blur(6px)' },
        to: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
        transition: { duration: 0.56, ease: EASE_OUT },
    },
    cascade: {
        from: { opacity: 0, y: 20 },
        to: { opacity: 1, y: 0 },
        transition: { duration: 0.44, ease: EASE_OUT },
        stagger: 0.09,
    },
    tilt: {
        from: {
            opacity: 0,
            y: 26,
            rotateX: 7,
            transformPerspective: 900,
            transformOrigin: 'bottom center',
        },
        to: { opacity: 1, y: 0, rotateX: 0 },
        transition: { duration: 0.5, ease: EASE_OUT },
        stagger: 0.07,
    },
    /* These two are the only effects that clip, and a clip does not end with
       the animation: both settle on `inset(0)` and go on cutting at the border
       box for the life of the page. That is safe for the blocks they are on —
       nothing in the figures band or the records list paints outside its own
       box, and the records' focus ring is deliberately drawn *inside* it
       (a.transparency-inner uses outline-offset: -3px, because the list clips
       with overflow: hidden). Anything added to those blocks later that draws
       beyond its border box — an outward focus ring, a shadow, a badge hung
       over a corner — will be cut off here, and wants slack in the inset
       (negative values work) rather than a new effect. */
    curtain: {
        from: { opacity: 0, clipPath: 'inset(0% 50% 0% 50%)', scale: 1.02 },
        to: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', scale: 1 },
        transition: { duration: 0.56, ease: EASE_OUT },
    },
    ledger: {
        from: { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)', x: -8 },
        to: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', x: 0 },
        transition: { duration: 0.5, ease: EASE_OUT },
        stagger: 0.055,
    },
    settle: {
        from: { opacity: 0, scale: 0.9, y: 10 },
        to: { opacity: 1, scale: 1, y: 0 },
        transition: { type: 'spring', stiffness: 380, damping: 26 },
        stagger: 0.045,
    },
};

type Props = {
    children: ReactNode;
    /** Index within a group, used to stagger siblings. */
    index?: number;
    as?: 'div' | 'section' | 'li' | 'article';
    className?: string;
    id?: string;
    /** Which entrance this block uses. Defaults to the house `rise`. */
    effect?: RevealEffect;
};

/**
 * Scroll reveal for section content: once only, on entering the viewport.
 *
 * The movement is deliberately small. On a government site the job of motion
 * is to show that content arrived in order, not to perform — so each section
 * gets its own gesture (see RevealEffect) but every one of them is brief and
 * none repeats. Readers who ask for less motion get the content immediately,
 * with no transform, no blur and no clip.
 *
 * The block also gains `data-shown` as it enters. That is the stylesheet's
 * cue for the details that draw themselves in — a heading's rule, an
 * agenda point's stroke, an event's date tile — so those stay plain CSS
 * transitions on transform and opacity, timed against the entrance, rather
 * than a second animation system for each one. Under reduced motion the
 * attribute is there from the first render, so everything is simply in place.
 */
export function Reveal({
    children,
    index = 0,
    as = 'div',
    className,
    id,
    effect = 'rise',
}: Props) {
    const reduced = useReducedMotion();
    const [shown, setShown] = useState(false);
    const Tag = motion[as];

    if (reduced) {
        const Plain = as;
        return (
            <Plain className={className} id={id} data-shown="">
                {children}
            </Plain>
        );
    }

    const step = EFFECTS[effect];

    return (
        <Tag
            id={id}
            className={className}
            data-shown={shown ? '' : undefined}
            initial={step.from}
            whileInView={step.to}
            onViewportEnter={() => setShown(true)}
            viewport={{ once: true, margin: '-60px' }}
            transition={{
                ...step.transition,
                // Capped so that the last card in a long row is not still
                // waiting to appear after the reader has scrolled past it.
                delay: Math.min(index, 6) * (step.stagger ?? 0.06),
            }}
        >
            {children}
        </Tag>
    );
}

export default Reveal;
