// ==UserScript==
// @name         Display UID on Pixiv, Fanbox, Patreon
// @namespace    https://github.com/Amasoken/scripts
// @version      2026-06-26
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

    const baseServiceUrl = {
        kemono: 'https://kemono.cr',
        pawchive: 'https://pawchive.st',
    };

    const icons = {
        kemono: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAfCAYAAACGVs+MAAAH+0lEQVRIx72XaWxcVxXHf/ctM/Nm8YyX2mPHdrzGSYjrpNlJ2zRLgSSloi2bRCtQ+VChVCKRqEIFH6gECEpoUUJLS1JamqJAiwCBWoUKke5KuuA2zVbHbhLHdsbLjD3zPDNv3nb5YDtK1RQ7EnCk++Hp3nfO/5z7P//zHsD3gfWA4P9jmoAdwNNAEGB7Iqj2xYPqt4GyT3qrZUGMlgWxmUcBtAJhIAQ0zTEBoyqs7eqsNnK6Ku4PaVOvNN/QED31vXW1bkdl6C/AdZ/kLBzRIkJQC2jAk8CtwE3AM9PZxKcBXckqkhF9zw9urCvdu6J6ElgvBKjAhISOe5Zfs2ZbW3xh3vG39Odsx/HlKcAGaJgfJZe1kTDf9+ReYERXxPKAqqxVBY26KtpdnyPAT4GzwODlpQLmt5UH9963Nvn1WzsS2u9PZD7oHS89BORVVQgmSp7XEA/csaIuoi9NRuJN8eDmCzlncabo9oBI+W5A2I5NNK5nnZK3psLQ7osG1Pi1NcbqeEhbUhHSdNdnoxBUOL7cCxQBAqrAkyy9Lhnet2td7ZaOypAYzrscOJ5+YdzyDgKocgphRhVs3thUVv/GwCTNiaD6+QWJRXnH/1x/1rYLpdIpwC5ZnpSQWl4b/kZntdG6vrFMW1pjBDRFJFrLQ/W9mdL+RVWhQ6m8C4AnuXlTU2zfdz9du2LAdIiHVPrGS/LZk+N7DU3pdnyJCrBmXsQ6MWbVrqmPbryxMcb+7jEmbZ97ll+TSEb1zX0Tpc5sybsI1JcF1a8urQmv3LG6JrQsGaazxmB5bQQB9GQsoydT0lxfZnRF3PLFReW/3Lk62XKoL4sEtrbG+cPJzOg7Fws/cXw5AlMcYNB0sFyZrzS027e1JcJLqsP87nia1/rz3NlZqfmShUcH818A7owF1ZvuWFQRWlkbodzQUBVBWFdorwixqTlWv6AytEVXlNs3NpfdfndXVdX+7lFG8i7fWVvLpO3zm3fH3hownUcA5xKAaRt3fbn2hsZoR0siSFdNmMfeGeWF3iy3LSyn6PpGf9YOTdo+r/abdKcKRAMq9bEAAU1BAvGQSmdNWNnUHItf3xALPt49xtPH0uxYVcOKujD/uljgwPvpg9va4odOjllcDkADEhnLUxZXGdu6asJiJO/yzPEMy5Jhvrmsiq1tcaIBldNjFqbtcz5r8+KHOU6nLSoNlbqojqYoeFKiKQJdFWiK4JV+k1hAZXNznL+dmbBe6M3u7smUzvjT5JsBEAEe9iXNuqI0fKalzBgwbYZMhwfW11EV1ghqCqvrIixLRhgwbQZNG9uT9GQsXvwwx/msQzKqUx3R0YTAl5CM6kR0hdNpi4Sh8dypTP/ZCft1X7INeA+wxYwcAhsrDe2p9opg9Y821FMb1ck7Hg1lAWbQAqhCMFpweOLdMZ56L8245V7aq4nobG2LU25oDJo2qUmH4bzDYM7BR1J0/IwvmQB+DTwISAFsBb4V0kQ6oqsrv7K4fPHdS6uoLwsgAXlZ8EviIsCX8Eq/yYNvpOhOFeagwgCUgKNC8LiUVAFHVWAIcGIB9cvrm2KfWj0vSldNGFX5z9IugPbyEK3lQQ71ZbFcecVz7RUhbm4u45b2BMmIrs2LBZITlruh6Mo88E8NWAU0qULki44vm+IBEZpm9Wzm+pLOaoNlyTCHz5kf229JBHl0SyNLrjFQhODo4CS7j6QCRUe+CvwKGFKATmCppgjd8/FM259rOZFAJKByc3P8Y9MrqAq2r6jm2uowEvClRALz40FZHdE2APuAXQqwB9iZLrrHPSlFT8Zi0HQu3fWsIKTkxsYoreVBdEVcArK1LcFtCxP4UqIIMG2PkbzDqbGiO5CznwS+BOxWgSjwQ1WIzkzR7TZtv1EIdNeXBDWFiK7MWoV4SGNdQ5RNzWXc0BhjVV2Eu66tpCaiowjBkOlwcrTIb4+lnZztj4xb3mJPkgFeFUyJUCNTA2nHgsrQTrPkjW1rTzSPFVz/xxvmqWVBdVZOKEIww9uZkgsgNelw+JzJwRMZK6AK8dqFyfuB94Ek8CcV8IFxoFLCvWMFd7cnSV0wnaZ3U4WD82KBrq5kWJ0NwFTQqTXTup6E3UeGnb/3ZcWZTOnpCzmn1/PlMuAXwJuAc/kscIGXBRy2fbk5V/J6PMkDowV35aq6aEtVWJtTZ8yYKgRvDeXZ8+bIsx9krKGSJ/tcX+5i6lvhHFCAjw4jd7oSACPAy5oiUkOTTkpXxS3rGqKGMhdWMqURRU+y563hi69fmNwOvD0d8J3p8l9SLvUTfIwA2WkJ7h80ndqOytDqtorQFZXxY9krgpfO53j07dHHCo7/DHAeOH5F7swhITc16ew58H765FjBmbU1BZC1XJ47Od4zWnD3MUWPmXX1ABRFYUF5sPelc+bDfz49Yc96Xgj+cTYnD583n7hrScWZWas12wEpJWnLw5OcGc67Xctrwx01kcAV0xECRvIuPz8y3P1B2rr/2EjRnM3/XK6AtpiKqgjzxGjxZweOpUct17/ij4MAnu+dcF4fmHxkXkwfmovvWSsAkLHlDPkGBk2norU8eP3CKgMhBKoQ0yIkODth89DR4Zcu5OwHTNu3/msALr+RguP35ErehkVVRvJMxuLIYJ6etIXrw197xvN/PDW+K6Ir7zn+1ajGVVhVWMPQla81lAUKYV2RAqQikJWGJisM7VnA+N9E/qhFgef5aIvlgM9eraN/A7XCX1o55MN7AAAAAElFTkSuQmCC',
        pawchive:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAG3RFWHRTb2Z0d2FyZQBDZWxzeXMgU3R1ZGlvIFRvb2zBp+F8AAADdklEQVRYw92Xz28TRxTH35tdOwYaLuH3gaaRUA+k2LCOCAJExB/AAfVSVWlNnMQ/ECAh4Ia0cANOBIHtJN4kJqqQOFU99FTVl0ZJbSdxUqQqhwpFQkrVSiAFQrI7M48DCfI6WW9ihyAxt50fO595P75vBokIPmXDWgAmh3pfCCH21nm8U83t4WNbCpA3kgIB2Mq3R1X/OPJD56ktAcgbiTgCPiztIyIKhmNsSwAKRnLNRVpHFD8PgOlM/02T89sAAHUetae5vfPKylgunfiWIT51BdB1nPhy/xshpQ8RUVUU6f+xS3EFGB3uq/OYYrG0T0o62dIZGwEAeDZs5BdNU6sEMJ3pHzY5/7583OtRp75p7/RXBMinkwIRbMFEABTsiDIAgKlM/4zF+aHynyuMUSDUzcaN5DkC+NnB4qQt/8cRwM2/ufSjawzZvVUTLGRaJEJO6wEAGCIdvRCpDSCbzWL9P39L++mVG4FQ172JgdRdSXTdCcAyl7a3Rq+8rQrAfLWgnLh6VQIAFId6i1zIIwRAQKIhGL748r37EgIR19QCJ52wAxRSWCiSrDbFKpnfNzvHDus6uWZBwUhKALBt5pRC6wWYb5pT2tp0uS4dGEsndqmI/5X2/ZJ5wvRs1lWxikN9I1yIE6UZPD87p7atcfLKSpjN4uTzGQEAFAh1KxtRtgkj2SCIbgFnl4KRCG2aFGd1HesP7juPiE+J6IOLJMnWlnB87KPdBwoDfTuBxKvyuChtC4vSczoe56sGdB0nGw9YQsoPVlSX5r3+2HXLFaA4lNxtcfoXEV2jnwhkMBxV7Ot7R7mQx9dIRxkMx5SKAJODvUJIuaHars3OMVgOtuJg359cihbHuSUpvboWGEnCKnxJJAPBcLzopgfl9cAGUH7N2khTGSN/qJsVjMQNALxTYf+vtY7YzCqAsfSDHSp6XlcbzStSOz6QWiSiOoc5Nv/bAMYHUq+JaEctV2ytI4q5dOI7hvjTekqxDSCfTlxGxPu1AizfGd5YnG9fOTUAtQbD8ZyrDkxn+hdMzrdVC9DQ5FMa20KydiFKpTCnyK8QIcoYu0iSfIDrCE4/Mk2L0KYqYVmxWeJCeB0twHxKY2gzLFBJmgdTZ0HSb5/0XfBrTw/u+cJbdi1jcqOVs+bH6V+P07+blnVGYex/f6h7z5a/jjejvQOyjfTQIxCKKAAAAABJRU5ErkJggg==',
    };

    const UID_ATTR = 'data-uid-checked';

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const selectAll = (selector, node = document) => [...node.querySelectorAll(selector)];

    function patchStyle() {
        const id = 'display-uid-style-patch';
        if (document.getElementById(id)) return;

        const patchStyle = `
.custom-uid-display-button img {
    max-width: 24px;
    max-height: 24px;
}`;

        const style = document.createElement('style');
        style.id = id;
        style.textContent = patchStyle;
        document.head.appendChild(style);
    }

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
        const nextScript = document.querySelector('script#__NEXT_DATA__');
        const scripts = nextScript ? [nextScript] : selectAll('script').filter((e) => e.innerText.includes('creator'));

        for (const script of scripts) {
            const text = script.innerText;
            let index = text.indexOf(`"creator":{"data`);
            if (index < 0) index = text.indexOf(`\\"creator\\":{\\"data`);
            if (index < 0) continue;

            const searchStr = text.substring(index, index + 100);
            const [, maybeId] = searchStr.match(/\\?"id\\?":\\?"(\d*?)\\?"/) ?? [];
            if (maybeId) return maybeId;
        }

        return null;
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
        if (userId !== 'request') return userId;

        const links = button?.parentNode?.parentNode?.parentNode?.querySelectorAll('a');
        const profileIds = [...links]
            .map((e) => e.href)
            .filter((link) => link.includes('/users/'))
            .map((link) => link.split('/users/').at(-1).split('/')[0]);
        const uniqueIds = Array.from(new Set(profileIds));

        if (uniqueIds.length > 1) console.log('Multiple ids found:', uniqueIds);
        userId = uniqueIds[0];

        if (/^\d+$/.test(userId)) return userId;

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
        fanbox: (id, base) => `${base}/fanbox/user/${id}`,
        pixiv: (id, base) => `${base}/fanbox/user/${id}`,
        patreon: (id, base) => `${base}/patreon/user/${id}`,
    };

    function createButton(id, attributes, service) {
        const button = document.createElement('button');
        for (const attr in attributes) {
            button.setAttribute(attr, attributes[attr]);
        }

        button.setAttribute(UID_ATTR, id);
        button.innerHTML = `<img src="${icons[service]}"/>`;
        button.style.backgroundColor = '#a3294a';
        button.style.color = '#fff';
        button.className += ' custom-uid-display-button';

        button.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();

            const a = document.createElement('a');
            a.href = createLink[host](id, baseServiceUrl[service]);
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

    let timeoutId = 0;

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

                    for (const service of ['kemono', 'pawchive']) {
                        const btn = createButton(id, attr, service);
                        button.parentNode.appendChild(btn);
                        button.setAttribute(UID_ATTR, id);
                    }
                }
            } else {
                if (!/pixiv\.net\/en\/users\/\d+/.test(window.location.href)) return;

                // on mobile, debounce all changes and try to get from the page directly after load
                if (timeoutId) clearTimeout(timeoutId);

                timeoutId = setTimeout(() => {
                    const actionButtons = document.querySelector('.action-buttons');
                    if (!actionButtons) return;
                    if (actionButtons.querySelector(`.ui-button[${UID_ATTR}]`)) return;

                    const button = actionButtons.querySelector(`.ui-button:not([${UID_ATTR}])`);
                    if (!button) return;

                    const [, id] = window.location.href.match(/pixiv\.net\/en\/users\/(\d+)/) ?? [];
                    if (!id) return;

                    const attr = getElementAttributes(['class', 'data-variant', 'data-full-width', /data-v-/], button);
                    const container = document.createElement('div');
                    container.style.display = 'flex';

                    for (const service of ['kemono', 'pawchive']) {
                        const btn = createButton(id, attr, service);
                        container.appendChild(btn);
                        button.setAttribute(UID_ATTR, id);
                    }

                    button.parentNode.appendChild(container);
                }, 1000);
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
                        for (const service of ['kemono', 'pawchive']) {
                            const btn = createButton(id, attr, service);
                            button.parentNode.appendChild(btn);
                            button.setAttribute(UID_ATTR, id);
                        }
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

                for (const service of ['kemono', 'pawchive']) {
                    const btn = createButton(id, attr, service);
                    button.parentNode?.appendChild(btn);
                }
            }
        },
    };

    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                host && observers[host](node);
            }
        }
    }).observe(document, { childList: true, subtree: true, attributes: true });

    patchStyle();
})();
