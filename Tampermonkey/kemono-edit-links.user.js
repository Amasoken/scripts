// ==UserScript==
// @name         Kemono edit document and image dl links
// @namespace    http://tampermonkey.net/
// @version      2025-10-23a
// @description  Adjust download name for kemono files, hide dupe images
// @author       Amasoken
// @match        https://kemono.cr/*
// @match        https://coomer.st/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kemono.cr
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-edit-links.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-edit-links.user.js
// ==/UserScript==

(async function () {
    'use strict';

    const normalizeString = (text) => {
        try {
            text = decodeURIComponent(text);
        } catch (error) {
            console.log('Error decoding:', error);
        }

        text = text.replaceAll(/\\\/:\*\?"<>/g, '');

        return text;
    };

    const getDocumentDownloadName = ({ userName, timestamp, postTitle, host, userId, postId, filename }) => {
        const name = `[${userName}][${timestamp}][${postTitle}] ${filename}`;
        return normalizeString(name);
    };

    const getImageDownloadName = ({ userName, timestamp, postTitle, host, userId, postId, filename }) => {
        const name = `kmn-${host} [${userName}][${userId}-${postId}] ${filename}`;
        return normalizeString(name);
    };

    const sleep = (ms) => {
        console.log('Sleep', ms);
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    async function waitFor(cb, timeout = 3000, delay = 50) {
        return new Promise(async (resolve, reject) => {
            const t1 = performance.now();
            while (true) {
                if (performance.now() - t1 > timeout) return reject(new Error('Timeout:: ' + timeout));
                try {
                    const result = cb();
                    if (result) return resolve(result);
                } catch (error) {
                    console.log('Error in waitFor::', error);
                    reject(error);
                }

                await sleep(delay);
            }
        });
    }

    function openInNewTab(url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener norefferer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function changeDownloadName(el, name, innerText) {
        // console.log('Change dl', { for: el, from: el.download || el?.src?.split('?f=').at(-1), to: name });
        const attr = el?.href ? 'href' : 'src';
        el[attr] = el[attr].split('?')[0] + '?f=' + name;
        if (innerText) el.innerText = 'dl: ' + name;
        el.setAttribute('data-dl-name', name);
    }

    async function editLinks() {
        const currentPage = window.location.href;
        if (!currentPage.includes('/post/')) {
            console.log('Not a post page, no links to edit');
            return;
        }

        const hasTs = await waitFor(() => document.querySelector('.post__published .timestamp'), 10000).catch(
            () => false
        );

        const unhandledSelector = `.post__attachment-link:not([data-dl-name]), .fileThumb.image-link:not([data-dl-name])`;
        const hasLinks = await waitFor(() => document.querySelector(unhandledSelector), 10000).catch((_) => false);
        hasLinks && console.log('Adjust links for:', [...document.querySelectorAll(unhandledSelector)]);

        if (!hasTs || !hasLinks) {
            console.log('No timestamp or links found, aborting', { hasTs, hasLinks });
            return;
        }

        if (window.location.href !== currentPage) {
            console.log(`Page changed from ${currentPage} to ${window.location.href}, aborting`);
            return;
        }

        const timestamp = document.querySelector('.post__published .timestamp').innerText;
        const postTitle = document.querySelector('.post__title').innerText; // .replace(/ \(Patreon\)| \(Pixiv Fanbox\)/, '');
        const userName = document.querySelector('.post__user-name').innerText;
        const [, host, userId, postId] =
            window.location.href.match(/kemono\.cr\/(\w+)\/user\/(\d+)\/post\/(\d+)/) ?? [];
        const pageInfo = {
            userName,
            timestamp,
            postTitle,
            host,
            userId,
            postId,
        };

        // document links
        for (const a of [...document.querySelectorAll('.post__attachment-link')]) {
            const dlName = getDocumentDownloadName({ ...pageInfo, filename: a.download });
            if (a.getAttribute('data-dl-name') === dlName) continue;

            changeDownloadName(a, dlName, 'dl: ' + dlName);
        }

        // image previews
        for (const a of [...document.querySelectorAll('.fileThumb.image-link')]) {
            const dlName = getImageDownloadName({ ...pageInfo, filename: a.download });
            if (a.getAttribute('data-dl-name') === dlName) continue;

            changeDownloadName(a, dlName);

            const span = document.createElement('span');
            span.innerText = normalizeString(a.download);
            span.className = 'kmn-preview-thumb';
            a.appendChild(span.cloneNode(true));

            const container = a.parentElement.parentElement;

            a.addEventListener('click', async (e) => {
                // allow to open in a new tab when ctrl+LMB
                if (e.ctrlKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    openInNewTab(a.href);
                } else {
                    const isDetached = await waitFor(() => !a.isConnected, 3000, 100).catch(() => false);
                    if (!isDetached) return;

                    const img = await waitFor(() => container.querySelector('img'), 3000);
                    changeDownloadName(img, dlName);
                    img.parentElement.appendChild(span.cloneNode(true));
                }
            });
        }

        // remove dupe links, kmn sometimes duplicates the 1st image for no reason
        for (const a of [...document.querySelectorAll('.fileThumb.image-link')]) {
            const dlName = a.getAttribute('data-dl-name');
            const sameNameImgs = [...document.querySelectorAll(`[data-dl-name="${dlName}"]:not([data-dupe])`)];
            sameNameImgs.pop();

            for (const img of sameNameImgs) {
                console.log('Removing dupe image preview', { img });
                // img.style.opacity = '0.3';
                img.style.display = 'none';
                img.setAttribute('data-dupe', dlName);
            }
        }
    }

    async function handleUrlChange(url) {
        if (url.startsWith('blob:')) {
            console.log('Ignoring blob url');
            return;
        }

        await waitFor(() => window.location.href === url, 10000);
        await editLinks();
    }

    try {
        // chromium
        window.navigation.addEventListener('navigate', (event) => handleUrlChange(event.destination.url));
    } catch (error) {
        if (!error.message.includes('window.navigation is undefined')) {
            console.log('Error setting up navigation listener:', error);
        }

        // firefox, use patched state functions instead of window.navigation
        ['pushState', 'replaceState'].forEach((fn) => {
            const original = history[fn];
            history[fn] = function (...args) {
                const result = original.apply(this, args);
                window.dispatchEvent(new Event('locationchange'));
                return result;
            };
        });

        window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
        window.addEventListener('locationchange', () => handleUrlChange(location.href));
    }

    await editLinks();

    // display file name for images
    const style = document.createElement('style');
    document.head.appendChild(style);
    style.textContent = `
figure:has(.fileThumb.image-link),
div[class^="_expanded_"] {
    position: relative;
}

.kmn-preview-thumb {
    position: absolute;
    color: white;
    width: 100%;
    left: 0;
    padding: 6px;
    text-align: center;
    background: #2a339daa;
    border: 1px solid #ffffff2a;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}

div[class^="_expanded_"] .kmn-preview-thumb {
    background: #0eb982aa;
}
`;
})();
