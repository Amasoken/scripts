// ==UserScript==
// @name         Remove disable-devtools scripts
// @namespace    https://github.com/Amasoken/scripts
// @version      0.2
// @description  Remove scripts with certain address or keyword
// @author       Amasoken
// @match        http*://*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/remove-disable-devtool-scripts.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/remove-disable-devtool-scripts.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_TEXT_FILTER = ['DisableDevtool', 'DevtoolsDetector', 'adblock', 'devtool'];
    SCRIPT_TEXT_FILTER.push('AdSense', 'contextmenu', '_ads');

    const SCRIPT_SRC_FILTER = ['disable-devtool', 'devtools-detector', 'detect2'];
    function filterScript(scriptNode, attribute, filter) {
        //<script>, 'src', ['keyword', 'keyword']
        for (const word of filter) {
            if (scriptNode[attribute].includes(word)) {
                console.log(`Removing script with word [${word}] in ${attribute} attribute`, scriptNode);
                scriptNode.parentNode.removeChild(scriptNode);
                return true;
            }
        }

        return false;
    }

    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLScriptElement) {
                    if (node.innerHTML) {
                        filterScript(node, 'innerHTML', SCRIPT_TEXT_FILTER);
                    } else if (node.src) {
                        filterScript(node, 'src', SCRIPT_SRC_FILTER);
                    }
                }
            }
        }
    }).observe(document, { childList: true, subtree: true });
})();
