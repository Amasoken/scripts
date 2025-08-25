// ==UserScript==
// @name         Display time properly in battle records
// @namespace    http://tampermonkey.net/
// @version      2025-08-25
// @description  try to take over the world!
// @author       Amasoken
// @match        https://act.hoyolab.com/app/zzz-game-record/index.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hoyolab.com
// @grant        none
// @downloadURL   https://github.com/Amasoken/scripts/raw/master/Tampermonkey/zenless-display-actual-time-in-tools.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/zenless-display-actual-time-in-tools.user.js
// ==/UserScript==

(async function () {
    'use strict';

    // almost a year since I've started using their tool, yet it still displays the wrong Battery Charge time (based on server time)

    const displayRemainingTime = () => {
        const [, batteryCountSpan, timeSpan] = [
            ...document.querySelectorAll('div[class^=container_] div[class^=left] > span'),
        ];
        const battery = batteryCountSpan?.innerText;
        if (!battery) return;

        const [currentBattery, totalBattery] = battery.split('/').map((e) => Number(e));
        const batteryLeft = totalBattery - currentBattery;

        console.log('[time fixer]', batteryLeft, new Date(Date.now() + batteryLeft * 6 * 60 * 1000));

        const text = `FULL AT LOCAL ~${new Date(Date.now() + batteryLeft * 6 * 60 * 1000).toLocaleTimeString(
            'default',
            {
                hour: 'numeric',
                minute: 'numeric',
            }
        )}`;

        timeSpan.innerText += '::\n' + text;
    };

    while (!document.querySelectorAll('div[class^=container_] div[class^=left] > span').length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    displayRemainingTime();
})();
