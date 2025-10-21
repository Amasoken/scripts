// ==UserScript==
// @name         Kemono navigation hotkeys
// @namespace    http://tampermonkey.net/
// @version      2025-10-21
// @description  Kemono navigation hotkeys
// @author       Amasoken
// @match        https://kemono.su/*
// @match        https://kemono.cr/*
// @match        https://coomer.su/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kemono.su
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-hotkeys.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-hotkeys.user.js
// ==/UserScript==

(function () {
    'use strict';

    console.log('init hotkeys');

    const getImages = () =>
        [
            ...document.querySelectorAll(
                'a.image-link>img, div[class*="_expanded"]>img, section>a>img, div[class*="imageContainer"]'
            ),
        ]
            .filter((e) => e.parentElement.style.display !== 'none')
            .map((e) => ({ image: e, rect: e.getBoundingClientRect() }));

    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function isDiscordPage() {
        return window.location.href.includes('kemono.cr/discord/server/');
    }

    const MIN_Y = -10;
    const MAX_Y = 10;

    const actions = {
        // Jump to the first image
        4: () => {
            const images = getImages();
            images[0]?.image?.scrollIntoView();
        },
        // Jump to the last image
        1: () => {
            const images = getImages();
            images.at(-1)?.image?.scrollIntoView();
        },
        // Jump to the next image
        5: () => {
            const images = getImages();
            const index = images.findIndex((e) => e.rect.y > MIN_Y);
            const img = images[index - 1] ?? images[index] ?? images.at(0);
            img?.image?.scrollIntoView();
        },
        // Jump to the previous image
        2: () => {
            const images = getImages();
            const index = images.findIndex((e) => e.rect.y > MAX_Y);
            const img = images[index] ?? images.at(-1);
            img?.image?.scrollIntoView();
        },
        // Favorite
        f: () => {
            document.querySelector('button[class*="favoriteButton"]')?.click();
        },
        // Favorite
        '.': () => {
            document.querySelector('button[class*="favoriteButton"]')?.click();
        },
        // emulate alt+RMB, which is used for saving images in https://github.com/Amasoken/scripts/raw/master/Tampermonkey/imageSaver.user.js
        7: () => {
            const images = getImages();
            const index = images.findIndex((e) => e.rect.y > MAX_Y);

            const img = images[index - 1] ?? images[index] ?? images.at(-1);
            simulateClick(img?.image, 'contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                altKey: true,
                button: 2,
            });
        },
        // Expand current image (clicks on preview)
        8: () => {
            const images = getImages();
            const index = images.findIndex((e) => e.rect.y > MAX_Y);
            const img = images[index - 1] ?? images[index] ?? images.at(-1);
            img?.image?.click();
        },
        // Expand all images in a post
        9: () => {
            const images = getImages();
            for (const image of images) {
                image.image?.click();
            }
        },
    };

    function simulateClick(el, type = 'click', options = {}) {
        const event = new MouseEvent(type, options);
        el?.dispatchEvent(event);
    }

    document.addEventListener('keydown', (e) => {
        // console.log(e.key);
        actions[e.key] && actions[e.key]();
    });
})();
