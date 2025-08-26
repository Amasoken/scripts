// ==UserScript==
// @name         Boorus Pagination
// @namespace    https://github.com/Amasoken/scripts
// @version      0.0.5
// @description  try to take over the world!
// @author       Amasoken
// @match        https://rule34.xxx/*
// @match        https://gelbooru.com/*
// @match        https://e621.net/*
// @match        https://exhentai.org/*
// @match        https://e-hentai.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rule34.xxx
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_pagination.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_pagination.user.js
// ==/UserScript==

(function () {
    'use strict';

    const isGallery = window.location.href.includes('.org/g/');
    const isImagePage = window.location.href.includes('.org/s/');

    function simulateClick(el, type = 'click', options = {}) {
        const event = new MouseEvent(type, options);
        el?.dispatchEvent(event);
    }

    // Numpad7 - download img
    // Numpad8 - original img
    // Arrow left/right - prev/next
    // ctrl + arrow left/right - first/last

    const COMMON_ACTIONS = {
        resizeImage: () =>
            document.querySelector('div#resized_notice>a, div#resize-link>a, #image-resize-link')?.click(),
        triggerDownloadScript: () =>
            simulateClick(document.querySelector('#img, #image'), 'contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                altKey: true,
                button: 2,
            }),
    };

    const KEYDOWN_ACTIONS = {
        'gelbooru.com': {
            ArrowLeft: (e) => {
                if (e.ctrlKey) {
                    document.querySelector(`a[alt="first page"], #paginator a:first-child`)?.click();
                } else {
                    document.querySelector(`a[alt="back"], #paginator a:has(+b)`)?.click();
                }
            },
            ArrowRight: (e) => {
                if (e.ctrlKey) {
                    document.querySelector(`a[alt="last page"], #paginator a:last-of-type:not(:has(+b))`)?.click();
                } else {
                    document.querySelector(`a[alt="next"], #paginator b+a`)?.click();
                }
            },
            7: (e) => e.code === 'Numpad7' && COMMON_ACTIONS.triggerDownloadScript(),
            8: (e) => e.code === 'Numpad8' && COMMON_ACTIONS.resizeImage(),
        },
        'rule34.xxx': {
            ArrowLeft: (e) => {
                document.querySelector(`#post-list a[alt="${e.ctrlKey ? 'first page' : 'back'}"]`)?.click();
            },
            ArrowRight: (e) => {
                document.querySelector(`#post-list a[alt="${e.ctrlKey ? 'last page' : 'next'}"]`)?.click();
            },
            7: (e) => e.code === 'Numpad7' && COMMON_ACTIONS.triggerDownloadScript(),
            8: (e) => e.code === 'Numpad8' && COMMON_ACTIONS.resizeImage(),
        },
        'e621.net': {
            ArrowLeft: () => document.querySelector(`#paginator-next, .active .nav-link.next`)?.click(),
            ArrowRight: () => document.querySelector(`#paginator-prev, .active .nav-link.prev`)?.click(),
            7: (e) => e.code === 'Numpad7' && COMMON_ACTIONS.triggerDownloadScript(),
            8: (e) => e.code === 'Numpad8' && COMMON_ACTIONS.resizeImage(),
        },
        'e-hentai.org': {
            Escape: () => isImagePage && document.querySelector('.sb a')?.click(),
            0: () => isImagePage && document.querySelector('.sb a')?.click(),
            7: () => {
                const el = document.querySelector('#img');
                // alt + RMB, requires the other script to work: https://github.com/Amasoken/scripts/raw/master/Tampermonkey/imageSaver.user.js
                simulateClick(el, 'contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    altKey: true,
                    button: 2,
                });
            },
            ArrowLeft: () => isGallery && [...document.querySelectorAll('.ptt td')][0]?.click(),
            ArrowRight: () => isGallery && [...document.querySelectorAll('.ptt td')].at(-1)?.click(),
        },
    };

    KEYDOWN_ACTIONS['exhentai.org'] = KEYDOWN_ACTIONS['e-hentai.org'];

    function simulateClick(el, type = 'click', options = {}) {
        console.log('trying click on ', el);
        const event = new MouseEvent(type, options);
        el?.dispatchEvent(event);
    }

    document.addEventListener('keydown', (e) => {
        !e.altKey && KEYDOWN_ACTIONS?.[window.location.host]?.[e.key]?.call(null, e);
    });
})();
