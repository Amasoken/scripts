// ==UserScript==
// @name         Kemono/Pawchive crosslinks
// @namespace    http://tampermonkey.net/
// @version      2026-06-26
// @description  Crosslinks on Kemono to Pawchive and vice versa
// @author       Amasoken
// @match        https://kemono.cr/*
// @match        https://pawchive.st/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pawchive.st
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-crosslinks.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/kemono-crosslinks.user.js
// ==/UserScript==

(async function () {
    'use strict';

    const icons = {
        pawchive:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAAG3RFWHRTb2Z0d2FyZQBDZWxzeXMgU3R1ZGlvIFRvb2zBp+F8AAADdklEQVRYw92Xz28TRxTH35tdOwYaLuH3gaaRUA+k2LCOCAJExB/AAfVSVWlNnMQ/ECAh4Ia0cANOBIHtJN4kJqqQOFU99FTVl0ZJbSdxUqQqhwpFQkrVSiAFQrI7M48DCfI6WW9ihyAxt50fO595P75vBokIPmXDWgAmh3pfCCH21nm8U83t4WNbCpA3kgIB2Mq3R1X/OPJD56ktAcgbiTgCPiztIyIKhmNsSwAKRnLNRVpHFD8PgOlM/02T89sAAHUetae5vfPKylgunfiWIT51BdB1nPhy/xshpQ8RUVUU6f+xS3EFGB3uq/OYYrG0T0o62dIZGwEAeDZs5BdNU6sEMJ3pHzY5/7583OtRp75p7/RXBMinkwIRbMFEABTsiDIAgKlM/4zF+aHynyuMUSDUzcaN5DkC+NnB4qQt/8cRwM2/ufSjawzZvVUTLGRaJEJO6wEAGCIdvRCpDSCbzWL9P39L++mVG4FQ172JgdRdSXTdCcAyl7a3Rq+8rQrAfLWgnLh6VQIAFId6i1zIIwRAQKIhGL748r37EgIR19QCJ52wAxRSWCiSrDbFKpnfNzvHDus6uWZBwUhKALBt5pRC6wWYb5pT2tp0uS4dGEsndqmI/5X2/ZJ5wvRs1lWxikN9I1yIE6UZPD87p7atcfLKSpjN4uTzGQEAFAh1KxtRtgkj2SCIbgFnl4KRCG2aFGd1HesP7juPiE+J6IOLJMnWlnB87KPdBwoDfTuBxKvyuChtC4vSczoe56sGdB0nGw9YQsoPVlSX5r3+2HXLFaA4lNxtcfoXEV2jnwhkMBxV7Ot7R7mQx9dIRxkMx5SKAJODvUJIuaHars3OMVgOtuJg359cihbHuSUpvboWGEnCKnxJJAPBcLzopgfl9cAGUH7N2khTGSN/qJsVjMQNALxTYf+vtY7YzCqAsfSDHSp6XlcbzStSOz6QWiSiOoc5Nv/bAMYHUq+JaEctV2ytI4q5dOI7hvjTekqxDSCfTlxGxPu1AizfGd5YnG9fOTUAtQbD8ZyrDkxn+hdMzrdVC9DQ5FMa20KydiFKpTCnyK8QIcoYu0iSfIDrCE4/Mk2L0KYqYVmxWeJCeB0twHxKY2gzLFBJmgdTZ0HSb5/0XfBrTw/u+cJbdi1jcqOVs+bH6V+P07+blnVGYex/f6h7z5a/jjejvQOyjfTQIxCKKAAAAABJRU5ErkJggg==',
        kemono: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAfCAYAAACGVs+MAAAH+0lEQVRIx72XaWxcVxXHf/ctM/Nm8YyX2mPHdrzGSYjrpNlJ2zRLgSSloi2bRCtQ+VChVCKRqEIFH6gECEpoUUJLS1JamqJAiwCBWoUKke5KuuA2zVbHbhLHdsbLjD3zPDNv3nb5YDtK1RQ7EnCk++Hp3nfO/5z7P//zHsD3gfWA4P9jmoAdwNNAEGB7Iqj2xYPqt4GyT3qrZUGMlgWxmUcBtAJhIAQ0zTEBoyqs7eqsNnK6Ku4PaVOvNN/QED31vXW1bkdl6C/AdZ/kLBzRIkJQC2jAk8CtwE3AM9PZxKcBXckqkhF9zw9urCvdu6J6ElgvBKjAhISOe5Zfs2ZbW3xh3vG39Odsx/HlKcAGaJgfJZe1kTDf9+ReYERXxPKAqqxVBY26KtpdnyPAT4GzwODlpQLmt5UH9963Nvn1WzsS2u9PZD7oHS89BORVVQgmSp7XEA/csaIuoi9NRuJN8eDmCzlncabo9oBI+W5A2I5NNK5nnZK3psLQ7osG1Pi1NcbqeEhbUhHSdNdnoxBUOL7cCxQBAqrAkyy9Lhnet2td7ZaOypAYzrscOJ5+YdzyDgKocgphRhVs3thUVv/GwCTNiaD6+QWJRXnH/1x/1rYLpdIpwC5ZnpSQWl4b/kZntdG6vrFMW1pjBDRFJFrLQ/W9mdL+RVWhQ6m8C4AnuXlTU2zfdz9du2LAdIiHVPrGS/LZk+N7DU3pdnyJCrBmXsQ6MWbVrqmPbryxMcb+7jEmbZ97ll+TSEb1zX0Tpc5sybsI1JcF1a8urQmv3LG6JrQsGaazxmB5bQQB9GQsoydT0lxfZnRF3PLFReW/3Lk62XKoL4sEtrbG+cPJzOg7Fws/cXw5AlMcYNB0sFyZrzS027e1JcJLqsP87nia1/rz3NlZqfmShUcH818A7owF1ZvuWFQRWlkbodzQUBVBWFdorwixqTlWv6AytEVXlNs3NpfdfndXVdX+7lFG8i7fWVvLpO3zm3fH3hownUcA5xKAaRt3fbn2hsZoR0siSFdNmMfeGeWF3iy3LSyn6PpGf9YOTdo+r/abdKcKRAMq9bEAAU1BAvGQSmdNWNnUHItf3xALPt49xtPH0uxYVcOKujD/uljgwPvpg9va4odOjllcDkADEhnLUxZXGdu6asJiJO/yzPEMy5Jhvrmsiq1tcaIBldNjFqbtcz5r8+KHOU6nLSoNlbqojqYoeFKiKQJdFWiK4JV+k1hAZXNznL+dmbBe6M3u7smUzvjT5JsBEAEe9iXNuqI0fKalzBgwbYZMhwfW11EV1ghqCqvrIixLRhgwbQZNG9uT9GQsXvwwx/msQzKqUx3R0YTAl5CM6kR0hdNpi4Sh8dypTP/ZCft1X7INeA+wxYwcAhsrDe2p9opg9Y821FMb1ck7Hg1lAWbQAqhCMFpweOLdMZ56L8245V7aq4nobG2LU25oDJo2qUmH4bzDYM7BR1J0/IwvmQB+DTwISAFsBb4V0kQ6oqsrv7K4fPHdS6uoLwsgAXlZ8EviIsCX8Eq/yYNvpOhOFeagwgCUgKNC8LiUVAFHVWAIcGIB9cvrm2KfWj0vSldNGFX5z9IugPbyEK3lQQ71ZbFcecVz7RUhbm4u45b2BMmIrs2LBZITlruh6Mo88E8NWAU0qULki44vm+IBEZpm9Wzm+pLOaoNlyTCHz5kf229JBHl0SyNLrjFQhODo4CS7j6QCRUe+CvwKGFKATmCppgjd8/FM259rOZFAJKByc3P8Y9MrqAq2r6jm2uowEvClRALz40FZHdE2APuAXQqwB9iZLrrHPSlFT8Zi0HQu3fWsIKTkxsYoreVBdEVcArK1LcFtCxP4UqIIMG2PkbzDqbGiO5CznwS+BOxWgSjwQ1WIzkzR7TZtv1EIdNeXBDWFiK7MWoV4SGNdQ5RNzWXc0BhjVV2Eu66tpCaiowjBkOlwcrTIb4+lnZztj4xb3mJPkgFeFUyJUCNTA2nHgsrQTrPkjW1rTzSPFVz/xxvmqWVBdVZOKEIww9uZkgsgNelw+JzJwRMZK6AK8dqFyfuB94Ek8CcV8IFxoFLCvWMFd7cnSV0wnaZ3U4WD82KBrq5kWJ0NwFTQqTXTup6E3UeGnb/3ZcWZTOnpCzmn1/PlMuAXwJuAc/kscIGXBRy2fbk5V/J6PMkDowV35aq6aEtVWJtTZ8yYKgRvDeXZ8+bIsx9krKGSJ/tcX+5i6lvhHFCAjw4jd7oSACPAy5oiUkOTTkpXxS3rGqKGMhdWMqURRU+y563hi69fmNwOvD0d8J3p8l9SLvUTfIwA2WkJ7h80ndqOytDqtorQFZXxY9krgpfO53j07dHHCo7/DHAeOH5F7swhITc16ew58H765FjBmbU1BZC1XJ47Od4zWnD3MUWPmXX1ABRFYUF5sPelc+bDfz49Yc96Xgj+cTYnD583n7hrScWZWas12wEpJWnLw5OcGc67Xctrwx01kcAV0xECRvIuPz8y3P1B2rr/2EjRnM3/XK6AtpiKqgjzxGjxZweOpUct17/ij4MAnu+dcF4fmHxkXkwfmovvWSsAkLHlDPkGBk2norU8eP3CKgMhBKoQ0yIkODth89DR4Zcu5OwHTNu3/msALr+RguP35ErehkVVRvJMxuLIYJ6etIXrw197xvN/PDW+K6Ir7zn+1ajGVVhVWMPQla81lAUKYV2RAqQikJWGJisM7VnA+N9E/qhFgef5aIvlgM9eraN/A7XCX1o55MN7AAAAAElFTkSuQmCC',
    };

    const isKemono = window.location.href.includes('https://kemono.cr');
    const crosslinkName = isKemono ? 'Pawchive' : 'Kemono';

    function getAltUrl(url = window.location.href) {
        if (isKemono) return url.replace('https://kemono.cr', 'https://pawchive.st');
        return url.replace('https://pawchive.st', 'https://kemono.cr');
    }

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

    function patchStyle() {
        const id = 'kemono-crosslinks-style-patch';
        if (document.getElementById(id)) return;

        const patchStyle = `
#user-header__info-top {
    display: flex;
    justify-content: space-between;
}
#user-header__profile--crosslink span {
    color: ${isKemono ? '#cc9d97' : '#e6702f'};
}
#user-header__profile--crosslink img {
    padding-right: 10px;
}
.paw-service-wrapper {
    position: relative;
}
.service-wrapper .service-label-crosslink, .paw-service-wrapper .service-label-crosslink {
    color: #ffffff;
    background-color: ${isKemono ? '#996243' : '#996243'};
    position: absolute;
    right: 0;
    bottom: 0;
    padding: 6px;
    border-radius: 8px;
    opacity: 0.5;
}
.service-wrapper .service-label-crosslink:hover, .paw-service-wrapper .service-label-crosslink:hover {
    opacity: 1;
}
.service-label-crosslink img {
    max-width: 16px;
    max-height: 16px;
}
`;

        const style = document.createElement('style');
        style.id = id;
        style.textContent = patchStyle;
        document.head.appendChild(style);
    }

    async function addCrossLinkToUserPage() {
        const id = 'user-header__profile--crosslink';
        const existingCrossLink = document.getElementById(id);
        if (existingCrossLink) return;

        const headerLink = await waitFor(() => document.querySelector('a.user-header__profile')).catch(() => null);
        if (!headerLink) return;

        const href = window.location.href;
        const icon = isKemono ? icons.pawchive : icons.kemono;

        const newLink = document.createElement('a');
        newLink.className = headerLink.className;
        newLink.id = id;
        newLink.target = '_blank';
        newLink.href = getAltUrl();
        newLink.innerHTML = `<span><img src="${icon}"></span> <span>${crosslinkName}</span>`;
        headerLink.parentNode.insertBefore(newLink, headerLink.nextSibling);
    }

    async function addCrossLinksToKemono() {
        const currentCard = await waitFor(() => document.querySelector('.user-card'));
        const userCards = [...document.querySelectorAll('.user-card')];

        for (const card of userCards) {
            let wrapper = card.querySelector('.service-wrapper');
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'service-wrapper';
                wrapper.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                card.appendChild(wrapper);
            }

            let crossLink = wrapper.querySelector('a');
            if (!crossLink) {
                crossLink = document.createElement('a');
                crossLink.className = 'service-label-crosslink';
                crossLink.target = '_blank';
                crossLink.innerHTML = `stub`;

                wrapper.appendChild(crossLink);
            }

            const label = card.querySelector('span.user-card__service');
            const service = label.innerText;

            if (['Patreon', 'Pixiv Fanbox'].includes(service)) {
                crossLink.href = getAltUrl(card.href);
                crossLink.innerHTML = crosslinkName;
                wrapper.style.display = 'block';
            } else {
                crossLink.href = '';
                crossLink.innerHTML = 'unavailable';
                wrapper.style.display = 'none';
            }
        }
    }

    async function addCrossLinksToPawchive() {
        const currentCard = await waitFor(() => document.querySelector('.user-card'));
        const userCards = [...document.querySelectorAll('.user-card')];

        for (const card of userCards) {
            let wrapper = card.parentElement;
            if (!wrapper.className.includes('paw-service-wrapper')) {
                wrapper = document.createElement('div');
                wrapper.className = 'paw-service-wrapper';

                card.parentElement.insertBefore(wrapper, card);
                wrapper.appendChild(card);
            }

            let crossLink = wrapper.querySelector('a.service-label-crosslink');
            if (!crossLink) {
                crossLink = document.createElement('a');
                crossLink.className = 'service-label-crosslink';
                crossLink.target = '_blank';
                crossLink.innerHTML = `stub`;

                wrapper.appendChild(crossLink);
            }

            const label = card.querySelector('span.user-card__service');
            const service = label.innerText;

            crossLink.href = getAltUrl(card.href);
            crossLink.innerHTML = crosslinkName;
        }
    }

    async function addCrossLinkToInfoCards() {
        if (isKemono) await addCrossLinksToKemono();
        else await addCrossLinksToPawchive();
    }

    // event listeners
    // ==================================

    const isUserPage = (url = window.location.href) => {
        return /(?:pawchive\.st|kemono\.cr)\/(?:patreon|fanbox)\/user\/(?!.*\/post)\d+/.test(url);
    };

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

        if (isUserPage(url)) {
            return addCrossLinkToUserPage();
        }

        if (/pawchive\.st\/(?:account|shares|post|importer|search_hash|dms|posts)/.test(url)) return;
        if (/kemono\.cr\/(?:account\/(?:review|keys)|importer|search_hash|dms|posts)/.test(url)) return;

        const userCard = await waitFor(() => document.querySelector('.user-card'), 3000).catch(() => null);
        if (userCard) {
            await addCrossLinkToInfoCards();
        }
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
