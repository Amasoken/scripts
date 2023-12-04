// ==UserScript==
// @name         Gelbooru resize by image click
// @namespace    https://github.com/Amasoken/scripts
// @version      0.0.1
// @description  Click on the image to resize, instead of clicking 'resize' button.
// @author       Amasoken
// @match        https://gelbooru.com/index.php?page=post*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license      MIT
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_resize_by_image_click.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_resize_by_image_click.user.js
// ==/UserScript==

(function () {
    'use strict';

    const handler = document.querySelector('#resize-link')?.children[0].onclick;
    const imageElement = document.querySelector('#image');

    if (handler && imageElement) {
        console.log('Setting handler...');
        try {
            imageElement.onclick = (event) => {
                handler(event);
                imageElement.onclick = undefined;
            };
            console.log('Set onclick handler on the image...');
        } catch (error) {
            console.error(error);
        }
    } else {
        console.log("Can't set the handler on this page");
    }
})();
