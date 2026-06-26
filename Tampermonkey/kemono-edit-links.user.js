// ==UserScript==
// @name         Kemono edit document and image dl links
// @namespace    http://tampermonkey.net/
// @version      2026-06-26
// @description  Adjust download name for kemono files, hide dupe images
// @author       Amasoken
// @match        https://kemono.cr/*
// @match        https://coomer.st/*
// @match        https://pawchive.st/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pawchive.st
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-edit-links.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-edit-links.user.js
// ==/UserScript==

(async function () {
    'use strict';

    window.__kmn_link_editor_userscript_active = true;

    // display file name for images
    function patchStyle() {
        const id = 'kemono-edit-links-style-patch';
        if (document.getElementById(id)) return;

        const patchStyle = `
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

div[class^="_expanded_"] .kmn-preview-thumb, .fileThumb.image-link:has(>img[style*="display: none"]) .kmn-preview-thumb {
    background: #0eb982aa;
}`;

        const style = document.createElement('style');
        style.id = id;
        style.textContent = patchStyle;
        document.head.appendChild(style);
    }

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

    const hostName = window.location.hostname;
    const prefix = hostName.includes('pawchive') ? 'paw-' : hostName.includes('kemono') ? 'kmn-' : '';

    const getImageDownloadName = ({ userName, timestamp, postTitle, host, userId, postId, filename }) => {
        const name = `${prefix}${host} [${userName}][${userId}-${postId}] ${filename}`;
        return normalizeString(name);
    };

    async function sleep(ms) {
        // console.log(`[${new Date().toLocaleTimeString()}] Sleeping: ${ms / 1000}s`);
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function waitFor(cb, timeout = 3000, delay = 50) {
        return new Promise(async (resolve, reject) => {
            const t1 = performance.now();
            while (true) {
                if (performance.now() - t1 > timeout) {
                    return reject(new Error('Timeout:: ' + timeout));
                }

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
        const attr = el?.href ? 'href' : 'src';
        el[attr] = el[attr].split('?')[0] + '?f=' + encodeURIComponent(name);
        if (innerText) el.innerText = 'dl: ' + name;
        el.setAttribute('data-dl-name', name);
    }

    async function editLinks() {
        const currentPage = window.location.href;
        if (!currentPage.includes('/post/')) return;

        const hasTs = await waitFor(
            () => document.querySelector('.post__published .timestamp, .post__published'),
            5000
        ).catch(() => false);

        if (!hasTs) {
            console.log('Abort, no timestamp found');
            return;
        }

        const linksSelector = `.post__attachment-link:not(.post__attachment-link--missing), .fileThumb.image-link`;
        await waitFor(() => window.location.href !== currentPage || document.querySelector(linksSelector), 5000).catch(
            () => {}
        );

        if (window.location.href !== currentPage) {
            console.log(`Page changed from ${currentPage} to ${window.location.href}, aborting`);
            return;
        }

        if (!document.querySelector(linksSelector)) {
            console.log('Abort, no links found');
            return;
        }

        console.log('Adjust links for:', [...document.querySelectorAll(linksSelector)]);

        const timestamp = document
            .querySelector('.post__published')
            .innerText?.split('Published: ')
            .at(-1)
            .split(' ')[0];
        const postTitle = document.querySelector('.post__title').innerText;
        const userName = document.querySelector('.post__user-name').innerText;
        const [, host, userId, postId] =
            window.location.href.match(/(?:kemono\.cr|pawchive\.st)\/(\w+)\/user\/(\d+)\/post\/(\d+)/) ?? [];
        const pageInfo = {
            userName,
            timestamp,
            postTitle,
            host,
            userId,
            postId,
        };

        // document links
        for (const a of [...document.querySelectorAll('.post__attachment-link:not(.post__attachment-link--missing)')]) {
            const dlName = getDocumentDownloadName({ ...pageInfo, filename: a.download });
            if (a.getAttribute('data-dl-name') === dlName) continue;

            changeDownloadName(a, dlName, 'dl: ' + dlName);
        }

        // image previews
        for (const a of [...document.querySelectorAll('.fileThumb.image-link')]) {
            const dlName = getImageDownloadName({ ...pageInfo, filename: a.download });
            const dlAttribute = a.getAttribute('data-dl-name');
            if (dlAttribute === dlName) continue;

            changeDownloadName(a, dlName);

            let span = a.querySelector('.kmn-preview-thumb');
            if (!span) {
                span = document.createElement('span');
                span.className = 'kmn-preview-thumb';
                a.appendChild(span.cloneNode(true));
            }
            // apply separately on injected/existing element (workaround for bug when img is reused on kmn on different pages)
            a.querySelector('.kmn-preview-thumb').innerText = normalizeString(a.download);

            const container = a.parentElement.parentElement;

            if (!dlAttribute) {
                a.addEventListener('click', async (e) => {
                    // allow to open in a new tab on ctrl+LMB
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
                        img.parentElement.querySelector('.kmn-preview-thumb').innerText = normalizeString(a.download);
                    }
                });
            }
        }

        // remove dupe links, kmn sometimes duplicates the 1st image for no reason
        for (const a of [...document.querySelectorAll('.fileThumb.image-link')]) {
            const dlName = a.getAttribute('data-dl-name');
            const sameNameImgs = [...document.querySelectorAll(`[data-dl-name="${dlName}"]`)].filter(
                (e) => e.href === a.href
            );
            const index = sameNameImgs.findIndex((e) => e === a);
            const isDupe = sameNameImgs.length > 1 && index < sameNameImgs.length - 1; // drop first dupe

            if (isDupe) {
                console.log('Removing dupe image preview', { a });
                // a.style.opacity = '0.3';
                a.style.display = 'none';
                a.setAttribute('data-dupe', dlName);
            } else {
                // manual cleanup; some elements seem to be reused
                // a.style.opacity = '1';
                a.style.display = 'block';
                a.removeAttribute('data-dupe');
            }
        }
    }

    // event listeners
    // ==================================

    let lastUrl = '';
    let activeNavigationId = 0;
    const isStaleNavigation = (navId) => navId !== activeNavigationId;

    async function handleUrlChange(url) {
        if (url.startsWith('blob:')) return;
        if (url === lastUrl) return;
        lastUrl = url;

        const currentNavId = ++activeNavigationId;
        await waitFor(() => window.location.href === url, 3000);
        if (isStaleNavigation(currentNavId)) return;

        await waitForLayoutShiftEnd(200, currentNavId);
        if (isStaleNavigation(currentNavId)) return;

        await editLinks();
    }

    function waitForLayoutShiftEnd(timeout, navId) {
        return new Promise((resolve) => {
            let layoutTimeout = null;

            const resetTimer = () => {
                clearTimeout(layoutTimeout);
                layoutTimeout = setTimeout(() => {
                    cleanup();
                    resolve();
                }, timeout);
            };

            const onLayoutChange = () => {
                if (isStaleNavigation(navId)) {
                    cleanup();
                    resolve(); // Resolve silently to avoid hanging promises
                    return;
                }
                resetTimer();
            };

            const cleanup = () => {
                clearTimeout(layoutTimeout);
                window.removeEventListener('layoutchange', onLayoutChange);
            };

            window.addEventListener('layoutchange', onLayoutChange);
            resetTimer(); // start debounce
        });
    }

    // event listeners
    // ==================================

    function watchNavigations() {
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
    }

    function watchMutations() {
        const observer = new MutationObserver(() => {
            window.dispatchEvent(new Event('layoutchange'));
        });

        // Observe documentElement instead of body to survive SPA body replacements
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            // attributeFilter: ['style', 'class'],
        });
    }

    // init
    // ==================================
    patchStyle();

    watchNavigations();
    watchMutations();

    handleUrlChange(window.location.href);
})();
