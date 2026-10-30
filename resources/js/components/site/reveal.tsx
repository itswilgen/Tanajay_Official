import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

type Props = {
    children: ReactNode;
    /** Index within a group, used to stagger siblings. */
    index?: number;
    as?: 'div' | 'section' | 'li' | 'article';
    className?: string;
    id?: string;
};

/**
 * Scroll reveal for section content: a short rise plus fade, once only.
 *
 * The movement is deliberately small (14px). On a government site the job of
 * motion is to show that content arrived in order, not to perform. Readers
 * who ask for less motion get the content immediately with no transform.
 *
 * The block also gains `data-shown` as it enters. That is the stylesheet's
 * cue for the details that draw themselves in — a heading's rule, an
 * agenda point's stroke, an event's date tile — so those stay plain CSS
 * transitions on transform and opacity, timed against the rise, rather than
 * a second animation system for each one. Under reduced motion the attribute
 * is there from the first render, so everything is simply in place.
 */
export function Reveal({
    children,
    index = 0,
    as = 'div',
    className,
    id,
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

    return (
        <Tag
            id={id}
            className={className}
            data-shown={shown ? '' : undefined}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            onViewportEnter={() => setShown(true)}
            viewport={{ once: true, margin: '-60px' }}
            transition={{
                duration: 0.42,
                delay: Math.min(index, 6) * 0.06,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            {children}
        </Tag>
    );
}

export default Reveal;
