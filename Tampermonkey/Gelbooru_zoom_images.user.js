// ==UserScript==
// @name         Zoom for images
// @namespace    https://github.com/Amasoken/scripts
// @version      2025-10-21
// @description  Zoom images on Gelbooru
// @author       Amasoken
// @match        https://kemono.cr/*
// @match        https://exhentai.org/*
// @match        https://e-hentai.org/*
// @match        https://gelbooru.com/*
// @match        https://rule34.xxx/index.php?page=post&s=view*
// @match        https://e621.net/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_zoom_images.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_zoom_images.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const selectors = [
        // selectors to apply 'zoom' attribute on
        '#img', // e-hentai.org
        'a.image-link>img', // kemono
        '.post__thumbnail img', // kemono
        '#image',
    ];

    const videoSelectors = [
        // selectors to apply 'zoom' attribute on
        '#gelcomVideoPlayer', // r34
    ];

    const style = document.createElement('style');
    document.head.appendChild(style);

    // ====================================================
    const div = document.createElement('div');
    div.className = 'indicator';
    div.style.cssText = `
background: #4f535b;
border-radius: 4px;
width: auto;
min-width: 60px;
padding: 0 4px;
height: 30px;
position: fixed;
top: 10px;
right: 10px;
display: flex;
align-items: center;
justify-content: center;
z-index: 10000;
white-space: nowrap;
cursor: pointer;
`;

    document.body.appendChild(div);

    // ====================================================

    const setZoom = (zoom, fitScreen) => {
        localStorage.setItem('zoom_level', zoom);
        localStorage.setItem('should_fit', fitScreen);

        const imgSelector = selectors.join(', ');
        const videoSelector = videoSelectors.join(', ');

        const indicatorText = zoom + '%' + (fitScreen ? ' fit' : '');

        style.textContent = `
${imgSelector} {
    zoom: ${zoom}%;
    ${fitScreen ? `max-height: 100vh; width: auto !important;` : ''}
}
${videoSelector} {
    zoom: ${zoom}%;
    ${fitScreen ? `max-height: 100vh; ` : ''}
}
.indicator::before {
    content: "${indicatorText}";
    font-size: 18px;
    color: #8f838b;
    font-weight: 700;
}
.indicator {${zoom === 100 && !fitScreen ? 'opacity: 40%;' : ''}}`;
    };

    let zoomLevel = parseInt(localStorage.getItem('zoom_level')) || 100;
    let fitScreen = JSON.parse(localStorage.getItem('should_fit')) ?? false;

    setZoom(zoomLevel, fitScreen);

    function handleHotKey(key) {
        if (key === '+') zoomLevel += 10;
        else if (key === '-') zoomLevel -= 10;
        else if (key === '*') zoomLevel = 100;
        else if (key === '/') fitScreen = !fitScreen;

        if (['+', '-', '*', '/'].includes(key)) setZoom(zoomLevel, fitScreen);
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) return;

        handleHotKey(e.key);
    });

    div.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        handleHotKey('/');
    };
})();
