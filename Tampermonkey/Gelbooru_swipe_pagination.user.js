// ==UserScript==
// @name         Boorus Swipe Pagination
// @namespace    https://github.com/Amasoken/scripts
// @version      2025-08-25
// @description  Add swipe pagination for gelbooru and some other sites (mobile)
// @author       Amasoken
// @match        https://rule34.xxx/*
// @match        https://gelbooru.com/*
// @match        https://exhentai.org/*
// @match        https://e-hentai.org/*
// @match        https://e621.net/*
// @match        https://kemono.cr/*
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_swipe_pagination.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_swipe_pagination.user.js
// ==/UserScript==

(function () {
    'use strict';

    const touch = {
        start: { x: 0, y: 0, ts: 0, zoom: 0 },
        end: { x: 0, y: 0, ts: 0, zoom: 0 },
        valid: true,
    };

    const TIMEOUT_AFTER_MS = 1000;
    const SWIPE_PERCENT_THRESHOLD = 30;

    // ================================

    // swipe LEFT > go NEXT
    const SELECTORS = {
        'gelbooru.com': {
            left: `a[alt="next"], #paginator b+a, .alert.alert-info:not([id]) > a:last-of-type`,
            right: `a[alt="back"], #paginator a:has(+b), .alert.alert-info:not([id]) > a:first-of-type`,
        },
        'rule34.xxx': {
            left: `#post-list a[alt="next"], #next_search_link`,
            right: `#post-list a[alt="back"], #prev_search_link`,
        },
        'exhentai.org': {
            left: `#unext, .ptds+td>a, #next`,
            right: `#uprev, td:has(+.ptds)>a, #prev`,
        },
        'e621.net': {
            left: `#paginator-next, .active .nav-link.next`,
            right: `#paginator-prev, .active .nav-link.prev`,
        },
        'kemono.cr': {
            left: `#paginator-top .pagination-button-current+a:not(.pagination-button-disabled), .next`,
            right: `#paginator-top a:has(+.pagination-button-current):not(.pagination-button-disabled), .prev`,
        },
    };

    // ================================

    function getDirectionFromDiff(xDiff, yDiff) {
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) return 'right';
            else return 'left';
        } else {
            if (yDiff > 0) return 'down';
            else return 'up';
        }
    }

    function getSwipeDirection() {
        const xDiff = touch.end.x - touch.start.x;
        const yDiff = touch.end.y - touch.start.y;

        return { x: xDiff, y: yDiff, direction: getDirectionFromDiff(xDiff, yDiff) };
    }

    function handleSwipeEnd() {
        for (const key in touch.start.zoom) {
            if (touch.start.zoom[key] !== touch.end.zoom[key]) return false;
        }

        const { x, direction } = getSwipeDirection();

        if (!['left', 'right'].includes(direction)) return false;

        const timeDiff = touch.end.ts - touch.start.ts;
        const swipePercentage = (Math.abs(x) / window.screen.width) * 100;

        if (timeDiff <= TIMEOUT_AFTER_MS && swipePercentage >= SWIPE_PERCENT_THRESHOLD) {
            const selector = SELECTORS?.[window.location.host]?.[direction];

            if (selector) {
                document.querySelector(selector)?.click();
                return true;
            }
        }

        return false;
    }

    const getZoom = () => {
        return {
            devicePixelRatio: window.devicePixelRatio,
            scale: window.visualViewport.scale,
            innerWidth: window.innerWidth,
        };
    };

    document.addEventListener('touchstart', (e) => {
        ({ timeStamp: touch.start.ts } = e);
        touch.start.zoom = getZoom();
        ({ clientX: touch.start.x, clientY: touch.start.y } = e.changedTouches[0]);

        const isVideo = e.target.tagName === 'VIDEO';
        const id = e.target.getAttribute('id')?.toLowerCase() ?? '';
        const className = e.target.className?.toLowerCase() ?? '';
        const isVideoControls =
            id.includes('player') ||
            id.includes('fluid') ||
            id.includes('controls') ||
            className.includes('player') ||
            className.includes('fluid') ||
            className.includes('controls');

        touch.valid = !isVideo && !isVideoControls;
    });

    document.addEventListener('touchend', (e) => {
        ({ timeStamp: touch.end.ts } = e);
        touch.end.zoom = getZoom();
        ({ clientX: touch.end.x, clientY: touch.end.y } = e.changedTouches[0]);

        if (touch.valid) handleSwipeEnd();
    });
})();
