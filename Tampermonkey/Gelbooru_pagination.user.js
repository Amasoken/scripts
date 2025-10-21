// ==UserScript==
// @name         Boorus Pagination
// @namespace    https://github.com/Amasoken/scripts
// @version      2025-10-21
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
        resizeImage: () => handleClick('div#resized_notice>a, div#resize-link>a, #image-resize-link'),
        // emulate alt+RMB, which is used for saving images in https://github.com/Amasoken/scripts/raw/master/Tampermonkey/imageSaver.user.js
        triggerDownloadScript: (selector = '#img, #image') => {
            const element = document.querySelector('#img, #image');
            if (!element) return false;
            simulateClick(document.querySelector(selector), 'contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                altKey: true,
                button: 2,
            });
            return true;
        },
    };

    function handleClick(selector) {
        const element = document.querySelector(selector);
        element?.click();

        return Boolean(element);
    }

    const KEYDOWN_ACTIONS = {
        'gelbooru.com': {
            ArrowLeft: (e) => {
                if (e.ctrlKey) return handleClick(`a[alt="first page"], #paginator a:first-child`);
                return handleClick(`a[alt="back"], #paginator a:has(+b)`);
            },
            ArrowRight: (e) => {
                if (e.ctrlKey) return handleClick(`a[alt="last page"], #paginator a:last-of-type:not(:has(+b))`);
                return handleClick(`a[alt="next"], #paginator b+a`);
            },
            7: (e) => e.code === 'Numpad7' && COMMON_ACTIONS.triggerDownloadScript(),
            8: (e) => e.code === 'Numpad8' && COMMON_ACTIONS.resizeImage(),
        },
        'rule34.xxx': {
            ArrowLeft: (e) => handleClick(`#post-list a[alt="${e.ctrlKey ? 'first page' : 'back'}"]`),
            ArrowRight: (e) => handleClick(`#post-list a[alt="${e.ctrlKey ? 'last page' : 'next'}"]`),
            7: (e) => e.code === 'Numpad7' && COMMON_ACTIONS.triggerDownloadScript(),
            8: (e) => e.code === 'Numpad8' && COMMON_ACTIONS.resizeImage(),
        },
        'e621.net': {
            ArrowLeft: () => handleClick(`#paginator-prev, .active .nav-link.prev`),
            ArrowRight: () => handleClick(`#paginator-next, .active .nav-link.next`),
            7: (e) => e.code === 'Numpad7' && COMMON_ACTIONS.triggerDownloadScript(),
            8: (e) => e.code === 'Numpad8' && COMMON_ACTIONS.resizeImage(),
        },
        'e-hentai.org': {
            Escape: () => isImagePage && handleClick('.sb a'),
            0: () => isImagePage && handleClick('.sb a'),
            7: (e) => e.code === 'Numpad7' && COMMON_ACTIONS.triggerDownloadScript('#img'),
            ArrowLeft: () => isGallery && [...document.querySelectorAll('.ptt td')][0]?.click(),
            ArrowRight: () => isGallery && [...document.querySelectorAll('.ptt td')].at(-1)?.click(),
        },
    };

    KEYDOWN_ACTIONS['exhentai.org'] = KEYDOWN_ACTIONS['e-hentai.org'];

    document.addEventListener('keydown', (e) => {
        if (!e.altKey && KEYDOWN_ACTIONS?.[window.location.host]?.[e.key]) {
            const hasFired = KEYDOWN_ACTIONS?.[window.location.host]?.[e.key]?.call(null, e);
            if (hasFired) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });
})();
