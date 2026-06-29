// ==UserScript==
// @name         Kemono navigation hotkeys
// @namespace    http://tampermonkey.net/
// @version      2026-06-26
// @description  Kemono navigation hotkeys
// @author       Amasoken
// @match        https://kemono.cr/*
// @match        https://coomer.st/*
// @match        https://pawchive.st/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pawchive.st
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-hotkeys.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-hotkeys.user.js
// ==/UserScript==

(function () {
    'use strict';

    console.log('init hotkeys');

    const getImages = () => {
        const selector = 'a.image-link>img, div[class*="_expanded"]>img, section>a>img, div[class*="imageContainer"]';
        const images = [...document.querySelectorAll(selector)]
            .filter((e) => e.parentElement.style.display !== 'none' && e.style.display !== 'none')
            .map((e) => ({ image: e, rect: e.getBoundingClientRect() }));

        return images;
    };

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

    // ACTIONS
    const jumpToTopmostImage = () => {
        const images = getImages();
        images[0]?.image?.scrollIntoView();
    };

    const jumpToBottommostImage = () => {
        const images = getImages();
        images.at(-1)?.image?.scrollIntoView();
    };

    const jumpToUpperImage = () => {
        const images = getImages();
        const index = images.findIndex((e) => e.rect.y > MIN_Y);
        const img = images[index - 1] ?? images[index] ?? images.at(0);
        img?.image?.scrollIntoView();
    };

    const jumpToLowerImage = () => {
        const images = getImages();
        const index = images.findIndex((e) => e.rect.y > MAX_Y);
        const img = images[index] ?? images.at(-1);
        img?.image?.scrollIntoView();
    };

    const favorite = () => {
        const selectors = [
            'button[class*="favoriteButton"]:not([class*="unfav"])', // user page
            'button.user-header__favourite:not([class*="unfav"])', // paw user page
            'button.post__fav:not(.post__fav--unfav)', // post page
        ];
        document.querySelector(selectors.join(','))?.click();
    };

    const unFavorite = () => {
        const selectors = [
            'button[class*="favoriteButton"][class*="unfav"]', // user page
            'button.user-header__favourite[class*="unfav"]', // paw user page
            'button.post__fav.post__fav--unfav', // post page
        ];
        document.querySelector(selectors.join(','))?.click();
    };

    // emulate alt+RMB, which is used for saving images in https://github.com/Amasoken/scripts/raw/master/Tampermonkey/imageSaver.user.js
    const altRmbClickOnImage = () => {
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
    };

    const expandCurrentImage = () => {
        const images = getImages();
        const index = images.findIndex((e) => e.rect.y > MAX_Y);
        const img = images[index - 1] ?? images[index] ?? images.at(-1);
        img?.image?.click();
    };

    const expandAllImages = () => {
        const images = getImages();
        for (const image of images) {
            image.image?.click();
        }
    };

    const goBack = () => {
        window.history.back();
    };

    const goForward = () => {
        window.history.forward();
    };

    // ========================================
    const hotkeys = {};

    const addHotkey = (keys, action) => {
        for (const key of keys) {
            hotkeys[key] = action;
        }
    };

    // Known limitations:
    // do not use shift + numpad keys - shift temporarily switches numpad state, and modifier key is not held
    // shift + NumpadDecimal == ShiftLeft -> NumpadDecimal (no modifiers) -> ShiftLeft
    // Too much work to work around it, so just avoid shift on numpad keys
    addHotkey(['Numpad4', 'Ctrl+Numpad5'], jumpToTopmostImage);
    addHotkey(['Numpad1', 'Ctrl+Numpad2'], jumpToBottommostImage);
    addHotkey(['Numpad2'], jumpToLowerImage);
    addHotkey(['Numpad5'], jumpToUpperImage);

    addHotkey(['KeyF', 'NumpadDecimal'], favorite);
    addHotkey(['Shift+KeyF', 'Ctrl+NumpadDecimal'], unFavorite);

    addHotkey(['Numpad7'], altRmbClickOnImage);
    addHotkey(['Numpad8'], expandCurrentImage);
    addHotkey(['Numpad9'], expandAllImages);

    addHotkey(['Numpad0'], goBack);
    addHotkey(['Ctrl+Numpad0'], goForward);

    function getHotkeyString(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        parts.push(e.code);

        return parts.join('+');
    }

    function simulateClick(el, type = 'click', options = {}) {
        const event = new MouseEvent(type, options);
        el?.dispatchEvent(event);
    }

    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) {
            return;
        }

        const hotkeyString = getHotkeyString(e);

        if (hotkeys[hotkeyString]) {
            e.preventDefault();
            hotkeys[hotkeyString]();
        }
    });
})();
