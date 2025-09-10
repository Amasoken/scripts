// ==UserScript==
// @name         Display UID on Pixiv, Fanbox, Patreon
// @namespace    https://github.com/Amasoken/scripts
// @version      2025-09-10
// @description  Display UID on Pixiv, Fanbox, Patreon
// @author       Amasoken
// @match        https://www.patreon.com/*
// @match        https://*.fanbox.cc/*
// @match        https://*.pixiv.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=patreon.com
// @grant        none
// @noframes
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Pixiv_display_uid.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Pixiv_display_uid.user.js
// ==/UserScript==

(async function () {
    'use strict';

    const KMN_BASE_URL = 'https://kemono.cr';
    const UID_ATTR = 'data-uid-checked';

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const selectAll = (selector, node = document) => [...node.querySelectorAll(selector)];

    function findObjectField(obj, fieldName) {
        if (!obj) return { found: false, value: null };

        for (const [name, value] of Object.entries(obj)) {
            if (name === fieldName) return { found: true, value };

            if (value && typeof value === 'object') {
                const result = findObjectField(value, fieldName);
                if (result.found) return result;
            }
        }

        return { found: false, value: null };
    }

    function getIdFromScripts() {
        const scripts = selectAll('script');

        const search = `\\"creator\\":`;
        const ids = scripts
            .filter((s) => s.innerText?.includes(search))
            .map((e) => {
                const index = e.innerText.indexOf(search);
                const searchStr = e.innerText.substring(index, index + 200);
                const [, maybeId] = searchStr.match(/\\"creator\\":\{.*?data.*?\\"id\\":\\"(\d+)\\"/) ?? [];
                return maybeId;
            });

        return ids.filter((id) => id)[0];
    }

    function getPId() {
        const { found, value } = findObjectField(window.__NEXT_DATA__, 'creator');
        if (found) return value.data.id;

        console.log('No __NEXT_DATA__ object found, looking in scripts');
        const id = getIdFromScripts();
        if (id) return id;

        console.log('No id found');
        return null;
    }

    function getFanboxIds() {
        const regexp = /pixiv\.net\/(?:\w+\/)?(?:users\/|member\.php\?id=)(\d+)\/?$/;

        const foundPixivLinks = selectAll('a').filter((a) => regexp.test(a.href));
        const userIds = foundPixivLinks.map((a) => a.href.match(regexp)?.[1]);

        const bgImageId = document
            .querySelector('div[src]')
            ?.getAttribute('src')
            ?.split('/creator/')
            .at(-1)
            ?.split('/cover')[0];

        if (bgImageId) userIds.push(bgImageId);

        const selfAddress = window.location.host + '/'; // "username.fanbox.cc/"

        // find avatars/backgrounds that might have id in the url
        const foundSelfLinks = selectAll('a').filter((a) => a.href.endsWith(selfAddress));

        for (const el of foundSelfLinks) {
            const bgElement = el.querySelector('div[style]');
            const maybeBg = bgElement?.style?.backgroundImage;
            if (maybeBg && maybeBg?.includes('fanbox')) {
                // potential self url
                const [, id] = maybeBg.match(/user\/(\d+)\/\w+/) ?? [];
                if (id) userIds.push(id);
            }
        }

        return Array.from(new Set(userIds));
    }

    function getPixivId(button) {
        let userId = button.getAttribute('data-gtm-user-id');
        if (userId) return userId;

        // mobile
        userId = button?.parentNode?.parentNode?.querySelector('a')?.href?.split(/\//g)?.at(-1);
        if (userId) return userId;

        // mobile but btn with no id
        // try to get from the url
        if (window.location.href.includes('/users/')) return window.location.href.split('/users/').at(-1);

        return;
    }

    let host;
    if (window.location.hostname.includes('fanbox.cc')) host = 'fanbox';
    else if (window.location.hostname.includes('patreon.com')) host = 'patreon';
    else if (window.location.hostname.includes('pixiv.net')) host = 'pixiv';

    const createLink = {
        fanbox: (id) => `${KMN_BASE_URL}/fanbox/user/${id}`,
        pixiv: (id) => `${KMN_BASE_URL}/fanbox/user/${id}`,
        patreon: (id) => `${KMN_BASE_URL}/patreon/user/${id}`,
    };

    function createButton(id, attributes) {
        const button = document.createElement('button');
        for (const attr in attributes) {
            button.setAttribute(attr, attributes[attr]);
        }

        button.setAttribute(UID_ATTR, id);
        button.innerText = ' uid: ' + id;
        button.style.backgroundColor = '#a3294a';
        button.style.color = '#fff';

        button.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();

            const a = document.createElement('a');
            a.href = createLink[host](id);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        return button;
    }

    function getElementAttributes(attributeList, sourceElement) {
        const attr = {};
        for (const attribute of attributeList) {
            if (attribute instanceof RegExp) {
                const sourceAttributes = Object.values(sourceElement.attributes).filter((a) => attribute.test(a.name));
                for (const sAttr of sourceAttributes) {
                    attr[sAttr.name] = sAttr.value;
                }

                continue;
            }

            const sourceAttr = sourceElement.getAttribute(attribute);
            if (sourceAttr) attr[attribute] = sourceAttr;
        }

        return attr;
    }

    const observers = {
        pixiv: (node) => {
            if (!node?.querySelector) return;

            const btnSelectors = `button[data-gtm-user-id], .user-details-follow, .ui-button:not([${UID_ATTR}])`;
            if (node.querySelector(btnSelectors)) {
                const followSelector = `button[data-gtm-user-id]:not([${UID_ATTR}]), .user-details-follow>button:not([${UID_ATTR}])`;
                const followSelectorM = `.ui-button:not([${UID_ATTR}])`;

                const followButtons = [
                    ...selectAll(followSelector, node),
                    ...selectAll(followSelectorM, node).filter((b) => b.innerText?.toLowerCase().includes('follow')),
                ];

                for (const button of Array.from(new Set(followButtons))) {
                    const id = getPixivId(button);
                    if (!id) continue;

                    const attr = getElementAttributes(['class', 'data-variant', 'data-full-width', /data-v-/], button);
                    const btn = createButton(id, attr);
                    button.parentNode.appendChild(btn);
                    button.setAttribute(UID_ATTR, id);
                }
            }
        },
        fanbox: async (node) => {
            if (!node?.querySelector) return;
            if (node.querySelector('img[class^="FollowButton"]')) {
                const followButtons = selectAll(`button:has(img[class^="FollowButton"]):not([${UID_ATTR}])`, node);

                let ids = [];
                for (let i = 0; i < 5; i++) {
                    await sleep(500);
                    ids = getFanboxIds();
                    if (ids.length) break;
                }

                for (const button of followButtons) {
                    const attr = getElementAttributes(['class'], button);
                    for (const id of ids) {
                        const btn = createButton(id, attr);
                        button.parentNode.appendChild(btn);
                        button.setAttribute(UID_ATTR, id);
                    }
                }
            }
        },
        patreon: (node) => {
            if (!node?.querySelector) return;

            const selector = `:is(a[data-tag*="upgrade"], button[data-tag*="patron"], button[data-tag*="membership"]):not([${UID_ATTR}])`;
            const followButtons = selectAll(selector);

            if (!followButtons.length) return;

            let id = getPId();
            if (!id) return;

            for (const button of followButtons) {
                button.setAttribute(UID_ATTR, id);
                const attr = getElementAttributes(['class'], button);

                const btn = createButton(id, attr);
                button.parentNode?.appendChild(btn);
            }
        },
    };

    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                host && observers[host](node);
            }
        }
    }).observe(document, { childList: true, subtree: true });
})();
