// ==UserScript==
// @name         Control reddit carousel with arrows
// @namespace    http://tampermonkey.net/
// @version      2025-08-25
// @description  Redirect Reddit to the old-new design
// @author       Amasoken
// @match        *://www.reddit.com/*
// @exclude      *://www.reddit.com/*/post-viewer/*
// @exclude      *://www.reddit.com/poll/*
// @exclude      *://www.reddit.com/media*
// @exclude      blob:https://www.reddit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// @run-at       document-start
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/reddit-control-carousel-with-arrows.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/reddit-control-carousel-with-arrows.user.js
// ==/UserScript==

(function () {
    'use strict';

    function isInViewport(element) {
        const bounds = element.getBoundingClientRect();

        const isVisible =
            (bounds.top > 0 && bounds.top <= window.innerHeight) ||
            (bounds.bottom > 0 && bounds.bottom <= window.innerHeight);

        return isVisible;
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            [...document.querySelectorAll('gallery-carousel')]
                .filter(isInViewport)[0]
                ?.shadowRoot?.querySelector('[aria-label="Previous page"]')
                ?.click();
        }
        if (e.key === 'ArrowRight') {
            [...document.querySelectorAll('gallery-carousel')]
                .filter(isInViewport)[0]
                ?.shadowRoot?.querySelector('[aria-label="Next page"]')
                ?.click();
        }
        if (window.location.href.endsWith('#lightbox') && e.key === '0') {
            document.querySelector('[aria-label="Close lightbox"]')?.click();
        }
    });

    // remove blur
    // const style = `.post-background-image-filter {filter: none !important;display: none !important;}`;
    // const styleSheet = document.createElement('style');
    // styleSheet.textContent = style;
    // document.head.appendChild(styleSheet);
    //
    // can be done with uBlock rule:
    // reddit.com##.post-background-image-filter:style( filter: none !important; display: none !important; )
})();
