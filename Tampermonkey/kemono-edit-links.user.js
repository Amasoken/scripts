// ==UserScript==
// @name         Kemono edit document and image dl links
// @namespace    http://tampermonkey.net/
// @version      2025-10-21
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

    const getDocumentDownloadName = ({ userName, timestamp, postTitle, host, userId, postId, filename }) => {
        return `[${userName}][${timestamp}][${postTitle}] ${filename}`;
    };

    const getImageDownloadName = ({ userName, timestamp, postTitle, host, userId, postId, filename }) => {
        return `kmn-${host} [${userName}][${userId}-${postId}] ${filename}`;
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

    function changeDownloadName(a, name, innerText) {
        console.log('Change dl', { from: a.download, to: name });
        a.href = a.href.split('?')[0] + '?f=' + encodeURIComponent(name);
        if (innerText) a.innerText = 'dl: ' + name;
        a.setAttribute('data-dl-name', name);
    }

    async function editLinks() {
        const currentPage = window.location.href;
        if (!currentPage.includes('/post/')) {
            console.log('Not a post page, no links to edit');
            return;
        }

        const hasTs = await waitFor(() => document.querySelector('.post__published .timestamp'), 10000, 50).catch(
            (_) => false
        );

        const hasLinks = await waitFor(
            () =>
                document.querySelector(
                    '.post__attachment-link:not([data-dl-name]), .fileThumb.image-link:not([data-dl-name])'
                ),
            10000,
            50
        ).catch((_) => false);

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

        const links = [...document.querySelectorAll('.post__attachment-link')];

        // document links
        for (const a of links) {
            const dlName = getDocumentDownloadName({ ...pageInfo, filename: a.download });

            if (a.getAttribute('data-dl-name') === dlName) {
                console.log('Skipping link, same attr::', dlName);
                continue;
            }

            changeDownloadName(a, dlName, 'dl: ' + dlName);
        }

        const thumbs = [...document.querySelectorAll('.fileThumb.image-link')];

        // image preview
        for (const a of thumbs) {
            let [, originalName] = a.href.split('?f=');
            originalName = originalName.replaceAll('+', ' ');

            const dlName = getImageDownloadName({ ...pageInfo, filename: originalName });

            if (a.getAttribute('data-dl-name') === dlName) {
                console.log('Skipping link, same attr::', dlName);
                continue;
            }

            changeDownloadName(a, dlName);

            const span = document.createElement('span');
            span.innerText = originalName;
            span.className = 'kmn-preview-thumb';
            a.appendChild(span);

            // allow to open in a new tab when ctrl+LMB
            a.onclick = (e) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    openInNewTab(a.href);
                }
            };
        }

        // remove dupe links, kmn sometimes duplicates the 1st image for no reason
        for (const a of thumbs) {
            const dlName = a.getAttribute('data-dl-name');
            const sameNameImgs = [...document.querySelectorAll(`[data-dl-name="${dlName}"]:not([data-dupe])`)];
            sameNameImgs.pop();

            for (const img of sameNameImgs) {
                console.log('Dupe::', img);
                // img.style.opacity = '0.3';
                img.style.display = 'none';
                img.setAttribute('data-dupe', dlName);
            }
        }
    }

    window.navigation.addEventListener('navigate', async (event) => {
        const url = event.destination.url;
        console.log('location changed!', url);
        if (url.startsWith('blob:')) {
            console.log('Ignoring blob url');
            return;
        }

        await waitFor(() => window.location.href === event.destination.url, 10000);
        await editLinks(event.destination.url);
    });

    await editLinks();

    // display file name for images
    const style = document.createElement('style');
    document.head.appendChild(style);
    style.textContent = `
.fileThumb.image-link {
    position: relative;
}

.fileThumb.image-link .kmn-preview-thumb {
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
`;
})();
