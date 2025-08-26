// ==UserScript==
// @name         Show original image with single click on Gelbooru, Danbooru, e621, Rule34
// @namespace    https://github.com/Amasoken/scripts
// @version      0.0.3
// @description  Click on the image to resize, instead of clicking 'resize' button.
// @author       Amasoken
// @match        https://danbooru.donmai.us/posts/*
// @match        https://e621.net/posts/*
// @match        https://gelbooru.com/index.php?page=post&s=view*
// @match        https://rule34.xxx/index.php?page=post&s=view*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license      MIT
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_resize_by_image_click.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_resize_by_image_click.user.js
// ==/UserScript==

(function () {
    'use strict';

    const resizeLinkSelectors = [
        '#resize-link>a', // gelbooru
        '#image-resize-notice>a', // danbooru
        '#resized_notice>a', // rule34
        '#image-resize-notice a', // e621
    ];

    const resizeLink = document.querySelector(resizeLinkSelectors.join(', '));
    const imageElement = document.querySelector('#image');

    const onClickPrev = imageElement?.onclick;

    if (resizeLink && imageElement && imageElement.tagName.toLowerCase() === 'img') {
        try {
            imageElement.onclick = (event) => {
                // do not trigger subtitle display on image click
                event.preventDefault();
                event.stopPropagation();

                resizeLink.click();
                imageElement.onclick = onClickPrev;
            };
            console.log('Set onclick handler on the image...');
        } catch (error) {
            console.error(error);
        }
    }
})();
