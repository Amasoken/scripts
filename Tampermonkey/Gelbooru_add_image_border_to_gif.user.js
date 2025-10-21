// ==UserScript==
// @name         Add border to gif on Gelbooru
// @namespace    https://github.com/Amasoken/scripts
// @version      2025-10-21
// @description  Add border indicator to gif images, similar how it's done with video
// @author       Amasoken
// @match        https://exhentai.org/*
// @exclude      https://exhentai.org/gallerypopups*
// @match        https://e-hentai.org/*
// @exclude      https://e-hentai.org/gallerypopups*
// @match        https://gelbooru.com/index.php?page=post&s=list*
// @match        https://gelbooru.com/index.php?page=post&s=view*
// @match        https://rule34.xxx/index.php?page=post&s=list*
// @match        https://rule34.xxx/index.php?page=post&s=view*
// @match        https://kemono.cr/*
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_add_image_border_to_gif.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_add_image_border_to_gif.user.js
// ==/UserScript==

(function () {
    'use strict';

    const baseBorderStyle = [
        // border for anything 'animated', excluding 'video'
        `#gdt a>div[title$=".gif"],
a>img[title*="animated"]:not([title*=" video "]),
a.fileThumb > img[src$="gif"] {
    border: 3px solid #02cae7;
}`,
        // position for preview containers
        `#gdt a>div[title],
a:has(>img:is([title*="animated"],[title*="video"])),
a.fileThumb:has(>img[src$="gif"]) {
    position: relative;
}`,
        // text for animated videos/gifs, will override below
        `#gdt a:has(>div[title$=".gif"])>div::before,
a:has(>img:is([title*="animated"],[title*="video"]))::before,
a.fileThumb:has(>img[src$="gif"])::before {
    content: "gif";
    width: auto;
    display: inline-block;
    text-align: center;
    background: #02cae7;
    color: #ffffff;
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 2px 8px;
    line-height: 20px;
    font-weight: 600;
}`,
        // kmn style override
        `a.fileThumb:has(>img[src$="gif"])::before {
    content: "RESIZED GIF";
    padding: 2px 8px;
    line-height: 20px;
    font-weight: 600;
    font-size: 16px;
    right: unset;
    bottom: unset;
}`,
        // "video" override, webm/mp4/etc.
        `a:has(>img[title*="video"])::before {
    content: "vid";
    background: #0000ff;
}`,
        // "animated" but with no indication of "video" or "animated_gif". either new or mistagged
        `a:has(>img[title*="animated"]:not([title*="video"]):not([title*="animated_gif"]))::before{
    content: "anim";
    background: #ab00ff;
}`,
        // border for gifs that are resized, to avoid mixing them up with still images
        `div:has(#resize-link:not([style*="display: none"])) section[data-tags*="animated"] #image,
div:has(#resized_notice:not([style*="display: none"])):has(#image[alt*="animated"]) #image {
    border: 3px solid #02cae7;
}
div:has(#resize-link:not([style*="display: none"])) section[data-tags*="animated"] picture::before,
div:has(#resized_notice:not([style*="display: none"])):has(#image[alt*="animated"]) #note-container::before {
    content: "RESIZED GIF";
    background: #02cae7;
    color: #ffffff;
    position: absolute;
    padding: 2px 8px;
    line-height: 20px;
    font-weight: 600;
    font-size: 16px;
}`,
        // disable "gif" text on r34, there's no 'animated_gif' tag really
        `.thumb > a::before {
    display: none !important;
}`,
    ];

    const style = document.createElement('style');
    document.head.appendChild(style);

    function updateStyle() {
        style.textContent = baseBorderStyle.join('\n');
    }

    updateStyle();
})();
