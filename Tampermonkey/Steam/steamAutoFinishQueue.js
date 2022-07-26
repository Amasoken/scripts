// ==UserScript==
// @name         Steam Auto queue
// @namespace    https://github.com/Amasoken/scripts
// @version      0.1
// @description  Automatically finish your Steam queue.
// @author       You
// @match        http*://store.steampowered.com/app/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // TODO add a separate button so no unintended queue skips happen?
    document.querySelector('.next_in_queue_content').click();
})();
