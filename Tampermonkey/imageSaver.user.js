// ==UserScript==
// @name         Open/save images with RMB without prompt on Gelbooru/Danbooru/etc
// @namespace    https://github.com/Amasoken/scripts
// @version      2026-06-18
// @description  interact with images using RMB and modifier keys
// @author       Amasoken
// @match        http*://*/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @license      MIT
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/imageSaver.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/imageSaver.user.js
// ==/UserScript==

/*
INFO:

Interact with images using RMB (Right Mouse Button) and modifier keys.
Basically a shortcut to save images without 'Save as' window, or preview images fast.
Created to save time while browsing gelbooru, deviantart, sankakucomplex, etc. since I got tired of waiting for 'Save as' window forever on my potato laptop.

Use cases:
- Open a bunch of images in separate tabs without doing 'Right click > Open in a new tab' routine
- View every image separately, save them faster without 'Save as' window or just close the tab
- Preview image in a new window, admire the image then save it or just close the window

Controls (when clicking on the image):
  alt + RMB: Download an image without prompt. If the image url is cross-origin AND no extension specified in the url, new tab will open instead. Example -- images in steam hub.
 ctrl + RMB: Open an image in a new tab (not focused).
shift + RMB: Open an image in a new window (focused).

On the opened image tab (when clicking on the image):
  alt + RMB: Download an image without prompt, then close the tab (won't close if opened by entering direct link in the address bar, since script can only close tabs when they were opened by script/context menu).
 ctrl + RMB: Close the tab.
shift + RMB: Close the tab.
*/

(function () {
    'use strict';

    const DEFAULT_DOWNLOAD_NAME = 'download';
    const AVAILABLE_EXTENSIONS = ['gif', 'ico', 'jpeg', 'jpg', 'png', 'webp'];

    const ENABLE_RMB_SHORTCUTS = true;
    const DBLCLK_SAVE_WHEN_LOWER_THEN = 300;
    const DBLCLK_IGNORE_WHEN_HIGHER_THAN = 800;
    const DBLCLK_MARGIN = 10;

    const GALLERY_NAME_LIMIT = 110;

    // sites as pixiv will block requests with no refferer with 403 error, so keep the refferer for these
    const KEEP_REFFERER_ORIGINS_LIST = ['https://www.pixiv.net', 'https://hitomi.la'];
    const USERSCRIPT_SETTINGS_KEY = 'userscript-image-saver-config';

    let dlPreference = '';
    const preference = {
        get: () => {
            const pref = localStorage.getItem(USERSCRIPT_SETTINGS_KEY) ?? '';
            console.log('Got dl preference:', pref);
            return pref;
        },
        set: (data) => {
            console.log('Set dl preference to', data);
            dlPreference = data;
            localStorage.setItem(USERSCRIPT_SETTINGS_KEY, data);
        },
    };

    dlPreference = preference.get();

    const isTargetImage = (e) => e.target.tagName === 'IMG' && e.target.src;
    const isImageOnlyPage = Boolean(document.body) && document.querySelector('body img') === document.body.lastChild;

    // === last resort CORS hack check ===
    // when site stores images on a different domain, CORS might prevent fetch from downloading the image
    // add a query string param, open in the new tab, then try to download:
    const CORS_HACK_PARAM = 'abcdef'; // query param to check for.
    const CLOSE_IFRAME_MESSAGE = 'userscript_close_image_dl_frame';
    const IFRAME_CLASSNAME = 'iframe-image-dl-hack';

    const isCORSHackUsed = window.location.search.includes(CORS_HACK_PARAM + '=');
    const originList = [];
    let isUsingIFrames = false;

    if (isCORSHackUsed) {
        if (document.querySelector('body img')?.src === window.location.href) {
            console.log('CORS hack query param detected, trying to download...');
            const shouldCloseTab = true;
            saveImage(window.location.href, shouldCloseTab);
        }
    }

    function handleIFrameMessage(event) {
        if (originList.includes(event.origin)) {
            if (event.data.startsWith(CLOSE_IFRAME_MESSAGE)) {
                const frameUrl = event.data.split(CLOSE_IFRAME_MESSAGE + '::').at(-1);

                const iframes = [...document.getElementsByClassName(IFRAME_CLASSNAME)];
                const iframe = iframes.filter((el) => el.src === frameUrl)[0];

                if (iframe) {
                    iframe.parentNode?.removeChild(iframe);
                }
            }
        }
    }
    // === end of hack check ===

    const clicks = {
        prev: null,
        next: null,
    };

    const resetClicks = () => {
        clicks.prev = null;
        clicks.next = null;
    };

    function oneHandClick(e) {
        clicks.prev = clicks.next;
        clicks.next = e;
        const { prev, next } = clicks;

        if (prev && next) {
            const diffX = Math.abs(prev.pageX - next.pageX);
            const diffY = Math.abs(prev.pageY - next.pageY);

            if (diffX <= DBLCLK_MARGIN && diffY <= DBLCLK_MARGIN) {
                const diff = next.timeStamp - prev.timeStamp;

                if (diff < DBLCLK_SAVE_WHEN_LOWER_THEN) {
                    tryImgEvent(e, { altKey: true });
                    resetClicks();

                    return true;
                } else if (diff < DBLCLK_IGNORE_WHEN_HIGHER_THAN) {
                    tryImgEvent(e, { ctrlKey: true });
                    resetClicks();

                    return true;
                }
            }
        }
    }

    function tryImgEvent(e, overrides = null) {
        let imageElement = isTargetImage(e) ? e.target : e.target.querySelector('img');
        if (imageElement) {
            e.preventDefault();
            handleImageClick(e, imageElement, overrides);
            return false;
        }
    }

    document.addEventListener(
        'contextmenu',
        (e) => {
            if (ENABLE_RMB_SHORTCUTS && oneHandClick(e)) {
                return false;
            }

            const { ctrlKey, altKey, shiftKey } = e;

            if (ctrlKey + altKey + shiftKey) {
                return tryImgEvent(e);
            }
        },
        false
    );

    function handleImageClick(e, imageElement = e.target, overrides = null) {
        const { ctrlKey = false, altKey = false, shiftKey = false } = overrides ?? e;
        const isSingleKeyPressed = ctrlKey + altKey + shiftKey === 1;
        if (!isSingleKeyPressed) return;

        console.log('Click with keys detected: ', { ctrlKey, altKey, shiftKey });

        // ctrl + RMB click
        if (ctrlKey) {
            e.stopPropagation();
            e.preventDefault();
            if (isImageOnlyPage) {
                closeWindow();
            } else {
                openInNewTab(imageElement.src);
            }
        }

        // alt + RMB click
        if (altKey) {
            const shouldCloseTab = isImageOnlyPage;
            e.stopPropagation();
            e.preventDefault();
            saveImage(imageElement.src, shouldCloseTab);
        }

        // shift + RMB click
        if (shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            !isImageOnlyPage && openInNewWindow(imageElement.src);
            isImageOnlyPage && closeWindow();
        }
    }

    function openInNewTab(imageUrl, keepRef = false) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.target = '_blank';

        if (!keepRef && !KEEP_REFFERER_ORIGINS_LIST.includes(window.location.origin)) {
            a.rel = 'noreferrer noopener';
        }

        a.click();
    }

    function openInIFrame(imageUrl) {
        const iframe = document.createElement('iframe');
        iframe.className = IFRAME_CLASSNAME;
        iframe.src = imageUrl;
        iframe.style.display = 'none';

        document.body.appendChild(iframe);
    }

    function openInNewWindow(imageUrl) {
        window.open(imageUrl, '_blank');
    }

    function closeWindow() {
        if (isCORSHackUsed) window.parent.postMessage(CLOSE_IFRAME_MESSAGE + '::' + window.location.href, '*');

        const closeButton = document.createElement('button');
        closeButton.onclick = () => window.close();

        closeButton.click();
    }

    function getNameAndExtensionFromUrl(url) {
        let fileName = url.split('/').at(-1); // last path part is probably the file name
        fileName = fileName.split('?')[0]; // drop query params if present
        fileName = decodeURI(fileName); // handle encoded url

        let ext = '',
            name = fileName || DEFAULT_DOWNLOAD_NAME;

        const splitFileName = fileName.split('.');

        // set extension if present
        if (splitFileName.length > 1) {
            ext = splitFileName.pop();
            name = splitFileName.join('.');
        }

        // tw*tter
        if (!ext && url.includes('twimg.com')) {
            ext = url.match(/format=(\w+)/)?.[1];
        }

        if (url.includes('kemono.cr/data') && url.includes('?f=')) {
            let [, originalName] = url.split('?f=');
            originalName = decodeURI(originalName).replaceAll('+', ' ');

            const splitName = originalName.split('.');
            const originalExt = splitName.pop();
            name = splitName.join('.');

            if (ext !== originalExt) {
                console.log('Extension mismatch', { ext, originalExt });
                ext = originalExt;
            }
        }

        const host = window.location.host;
        switch (true) {
            case /e(?:-|x)h(?:e)nt.i\.org/.test(host): {
                try {
                    const galleryTitle = document.querySelector('h1').innerText.slice(0, GALLERY_NAME_LIMIT);
                    let [current, last] = [...document.querySelectorAll('#i2 span')].map((e) => e.innerText);
                    current = current.padStart(last.length, '0');
                    name = `${galleryTitle} (${current} of ${last}) ` + name;
                } catch (error) {
                    console.error(error);
                }

                break;
            }

            case /(?:x|twitter)\.com/.test(host): {
                try {
                    const [, userTag, postId] = window.location.href.match(/[twitter|x]\.com\/(.+)\/status\/(\d+)\//);
                    if (userTag && postId) {
                        name = `twitter_${userTag}_${postId}_` + name;
                    }
                } catch (error) {
                    console.error(error);
                }

                break;
            }

            case /kem(?:o)no\.cr/.test(host): {
                if (unsafeWindow.__kmn_link_editor_userscript_active) break;

                try {
                    const usernameElement = document.querySelector('.post__user-name');
                    const username = usernameElement.innerText;

                    const [, host, userId, postId] = window.location.href.match(
                        /kemono\.cr\/(\w+)\/user\/(\d+)\/post\/(\d+)/
                    );

                    const prefix = `kmn-${host} [${username}][${userId}-${postId}] `;
                    name = prefix + name;
                } catch {}

                break;
            }

            default:
                break;
        }

        // check if extension is correct and not just a part of file name, like in 'file.name'
        if (ext && !AVAILABLE_EXTENSIONS.includes(ext)) {
            name += `.${ext}`;
            ext = '';
        }

        return [name, ext];
    }

    function getFileName(url) {
        const [name, ext] = getNameAndExtensionFromUrl(url);

        if (ext && AVAILABLE_EXTENSIONS.includes(ext)) {
            return `${name}.${ext}`;
        }

        return name;
    }

    function saveImageWithA(url, name) {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;

        a.click();
        a.remove();
    }

    function downloadImageWithFetch(url, name) {
        return fetch(url)
            .then((res) => res.blob())
            .then((blob) => {
                const urlObject = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = urlObject;
                a.download = name;
                document.body.appendChild(a);

                a.click();
                a.remove();
                URL.revokeObjectURL(urlObject);

                return true;
            })
            .catch((error) => {
                console.error('Error downloading the file with fetch:', error);
                return false;
            });
    }

    function saveImageWithACrossOriginHack(url) {
        if (!isUsingIFrames) {
            isUsingIFrames = true;
            window.addEventListener('message', handleIFrameMessage);
        }

        const imageUrl = new URL(url);
        imageUrl.searchParams.append(CORS_HACK_PARAM, '');

        if (!originList.includes(imageUrl.origin)) originList.push(imageUrl.origin);

        // openInNewTab(imageUrl, true);
        openInIFrame(imageUrl);

        return true;
    }

    function isSameOrigin(link1, link2) {
        const URL1 = new URL(link1);
        const URL2 = new URL(link2);

        return URL1.origin === URL2.origin;
    }

    // force r*ddit to use image url instead of preview url
    function adjustUrlIfNeeded(rawUrl) {
        const url = new URL(rawUrl);

        const host = url.host;
        switch (true) {
            case /preview\.redd\.it/.test(host): {
                return url.href.replace('preview.redd.it', 'i.redd.it');
            }

            default:
                return url.href;
        }
    }

    function downloadFn({ url, shouldCloseTab, fileName }) {
        return {
            plain() {
                saveImageWithA(url, fileName);
                if (shouldCloseTab) closeWindow();
                return true;
            },
            fetch() {
                return downloadImageWithFetch(url, fileName);
            },
            gm() {
                return new Promise((resolve, reject) => {
                    // raw GM_download no longer works for cross origin dls. try to dl as a blob
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url,
                        responseType: 'blob', // Force the response into a binary data blob
                        withCredentials: true,
                        headers: {
                            // spoof the referrer to avoid hotlink protections (full image on gelbooru won't load without this)
                            Referer: window.location.href,
                            Origin: window.location.origin,
                            'User-Agent': navigator.userAgent,
                            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                        },
                        onload: function (response) {
                            console.log({ response });

                            const contentType = response.responseHeaders.toLowerCase();
                            if (contentType.includes('text/html')) {
                                reject({ success: false, error: 'GM_xmlhttpRequest returned text/html' });
                                return;
                            }

                            if (response.status >= 200 && response.status < 300) {
                                const blob = response.response;

                                GM_download({
                                    url: blob, // pass blob directly instead of url
                                    name: fileName,
                                    onload: () => {
                                        resolve({ success: true });
                                        if (shouldCloseTab) closeWindow();
                                    },
                                    onerror: (error) => {
                                        reject({ success: false, error });
                                    },
                                });
                            } else {
                                reject({ success: false, error });
                            }
                        },
                        onerror: function (error) {
                            reject({ success: false, error });
                        },
                    });
                });
            },
            iframe() {
                return saveImageWithACrossOriginHack(url);
            },
        };
    }

    async function saveImage(url, shouldCloseTab) {
        url = adjustUrlIfNeeded(url);
        const fileName = getFileName(url);
        const download = downloadFn({ url, shouldCloseTab, fileName });
        console.log('Trying to save image', { fileName, url });

        // for same origin download with A tag since it's faster than waiting for onload
        if (isSameOrigin(window.location.href, url)) {
            return download.plain();
        }

        if (dlPreference && Object.keys(download).includes(dlPreference)) {
            try {
                const result = await download[dlPreference]();
                if (result === true || result?.success === true) return;
            } catch (error) {
                console.log('got error downloading with preffered method::', error);
            }
        }

        // try fetch first, chances are it works fine without CORS
        if (await download.fetch()) {
            return preference.set('fetch');
        }

        console.log('Cross origin, using GM_download');
        const { error, success } = await download.gm().catch((error) => ({ error }));
        if (success) {
            return preference.set('gm');
        }

        console.log('got error::', error);

        if (error.error === 'not_whitelisted') {
            console.log('Image is possibly webp, trying download with <a> element');
            preference.set('');
            return download.plain();
        }

        console.log('As a last resort, trying to download image via iframe to avoid CORS');
        download.iframe();
        return preference.set('iframe');
    }
})();

// POSSIBLE HACK FOR CORS
// Download using CORS proxy.
// Requires CORS proxy server running somewhere, such as cors-anywhere.
// Might be useful on sites like pixiv that store image on a different domain.
//
// function saveImageWithProxyCORS(url, name) {
//     fetch('//cors-anywhere.yourdomain.com/' + url)
//         .then((res) => res.blob())
//         .then((blob) => {
//             const blobUrl = URL.createObjectURL(blob);
//             saveImageWithA(blobUrl, name);
//             // URL.revokeObjectURL(blobUrl);
//         })
//         .catch((error) => console.log('Error downloading with fetch:', error));
// }

// ANOTHER POSSIBLE HACK is using canvas
// Create Image element, paint it on canvas, get data url, save using <a> tag.
// That's probably not the same image as it might be encoded differently,
// but still might be useful in some cases.
