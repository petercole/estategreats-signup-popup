'use client';
/**
 * When the popup is allowed to appear on its own.
 *
 * The rules exist to keep this from being the thing people hate about
 * marketing sites. A popup that fires on load, over a checkout, or again the
 * day after you closed it costs more goodwill than the signup is worth. So:
 * wait until someone has actually read something (time OR scroll), never
 * interrupt a transaction, never compete with a signup form already on screen,
 * and take "no" for an answer for a day. A day is long enough that closing it
 * clears your path through the site, and short enough that a buyer who comes
 * back next weekend for a different sale gets the offer again. Signing up is
 * the permanent answer.
 *
 * The defaults below are the shared defaults for both sites. A site can
 * override any of them, but should have a reason.
 */
import { useEffect, useRef } from 'react';
export const DEFAULT_SCHEDULE = {
    desktopDelaySeconds: 30,
    desktopScrollFraction: 0.5,
    mobileDelaySeconds: 45,
    mobileScrollFraction: 0.6,
    exitIntentAfterSeconds: 15,
    dismissDays: 1,
    embeddedSignupSelector: '[data-eg-embedded-signup]',
    blockedPathPrefixes: [
        '/checkout',
        '/cart',
        '/payment',
        '/pay',
        '/account',
        '/login',
        '/signin',
        '/sign-in',
        '/admin',
        '/sale-alerts',
    ],
};
export function isBlockedPath(pathname, prefixes) {
    const path = pathname.toLowerCase();
    return prefixes.some((prefix) => {
        const p = prefix.toLowerCase();
        return path === p || path.startsWith(p.endsWith('/') ? p : `${p}/`);
    });
}
/** Coarse mobile check. Pointer coarseness beats a user-agent sniff here: an
 *  iPad in desktop mode should still get the patient mobile timing. */
export function isMobileViewport() {
    if (typeof window === 'undefined')
        return false;
    // matchMedia is missing in some embedded webviews and in jsdom; width alone
    // is a fine fallback, it just cannot tell a touch laptop from a mouse one.
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) {
        return true;
    }
    return window.innerWidth < 768;
}
function scrolledFraction() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0)
        return 1;
    return Math.min(1, Math.max(0, window.scrollY / scrollable));
}
/**
 * Watches time, scroll, and exit intent, and fires `onTrigger` at most once.
 * Everything unwinds on unmount — no stray timers, no listeners left behind on
 * a client-side route change.
 */
export function useSignupPopupSchedule({ enabled, onTrigger, pathname, schedule, }) {
    const firedRef = useRef(false);
    const triggerRef = useRef(onTrigger);
    triggerRef.current = onTrigger;
    useEffect(() => {
        if (!enabled)
            return;
        if (typeof window === 'undefined')
            return;
        if (isBlockedPath(pathname, schedule.blockedPathPrefixes))
            return;
        firedRef.current = false;
        const mountedAt = Date.now();
        const mobile = isMobileViewport();
        const delaySeconds = mobile ? schedule.mobileDelaySeconds : schedule.desktopDelaySeconds;
        const scrollFraction = mobile
            ? schedule.mobileScrollFraction
            : schedule.desktopScrollFraction;
        const embeddedSignupVisible = () => {
            if (!schedule.embeddedSignupSelector)
                return false;
            const nodes = document.querySelectorAll(schedule.embeddedSignupSelector);
            for (const node of nodes) {
                const rect = node.getBoundingClientRect();
                const onScreen = rect.bottom > 0 &&
                    rect.top < window.innerHeight &&
                    rect.right > 0 &&
                    rect.left < window.innerWidth;
                // A zero-size rect means display:none or a collapsed container — not
                // actually in front of anyone.
                if (onScreen && rect.width > 0 && rect.height > 0)
                    return true;
            }
            return false;
        };
        const fire = (trigger) => {
            if (firedRef.current)
                return;
            if (embeddedSignupVisible())
                return;
            firedRef.current = true;
            triggerRef.current(trigger);
        };
        const timer = window.setTimeout(() => fire('time'), delaySeconds * 1000);
        const onScroll = () => {
            if (scrolledFraction() >= scrollFraction)
                fire('scroll');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        let onMouseOut = null;
        if (schedule.exitIntentAfterSeconds !== null && !mobile) {
            onMouseOut = (event) => {
                // relatedTarget null + leaving through the top edge is the browser
                // chrome, i.e. someone reaching for the tab bar or the back button.
                if (event.relatedTarget !== null)
                    return;
                if (event.clientY > 0)
                    return;
                const seconds = (Date.now() - mountedAt) / 1000;
                if (seconds < schedule.exitIntentAfterSeconds)
                    return;
                fire('exit-intent');
            };
            document.addEventListener('mouseout', onMouseOut);
        }
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('scroll', onScroll);
            if (onMouseOut)
                document.removeEventListener('mouseout', onMouseOut);
        };
    }, [enabled, pathname, schedule]);
}
