// ==UserScript==
// @name         Redirect to higher res sticker image page VK
// @namespace    https://github.com/Amasoken/scripts
// @version      0.1
// @description  Redirect from 128b sticker to 512b sticker page
// @author       You
// @match        https://vk.com/sticker/*-128b
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const url = window.location.href;

    const [base, id] = url.split('sticker/');
    const id512 = id.replace('128b', '512b');

    const link = `${base}${`sticker/`}${id512}`;
    window.location.href = link;
})();
