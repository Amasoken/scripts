// ==UserScript==
// @name         Add border to gif on Gelbooru
// @namespace    https://github.com/Amasoken/scripts
// @version      2025-08-25
// @description  Add border indicator to gif images, similar how it's done with video
// @author       Amasoken
// @match        https://exhentai.org/*
// @match        https://e-hentai.org/*
// @match        https://gelbooru.com/index.php?page=post&s=list*
// @match        https://gelbooru.com/index.php?page=post&s=view*
// @match        https://rule34.xxx/index.php?page=post&s=list*
// @match        https://rule34.xxx/index.php?page=post&s=view*
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_add_image_border_to_gif.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/Gelbooru_add_image_border_to_gif.user.js
// ==/UserScript==

(function () {
    'use strict';
    const STORAGE_KEYS = {
        displayNames: 'userscript_display_img_title',
        collapseGallery: 'userscript_collapse_gallery_info',
    };

    let displayNames = JSON.parse(localStorage.getItem(STORAGE_KEYS.displayNames) ?? 'false');
    let collapseGallery = JSON.parse(localStorage.getItem(STORAGE_KEYS.collapseGallery) ?? 'false');

    const baseBorderStyle = [
        // border for anything 'animated', excluding 'video'
        `#gdt a>div[title$=".gif"],
a>img[title*="animated"]:not([title*="video"]) {
    border: 3px solid #02cae7;
}`,
        // position for preview containers
        `#gdt a>div[title],
a:has(>img:is([title*="animated"],[title*="video"])) {
    position: relative;
}`,
        // text for animated videos/gifs, will override below
        `#gdt a:has(>div[title$=".gif"])>div::before,
a:has(>img:is([title*="animated"],[title*="video"]))::before {
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
    ].join('\n');

    // image title
    const displayNameStyle = `
#gdt div[title]::after {
    content: attr(title);
    display: inline-block;
    background-color: #1f1f69;
    width: 100%;
    font-size: 12px;
    padding: 0 0 5px 0;
    position: absolute;
    top: -15px;
    left: -1px;
    border: 1px solid white;
}
`;

    // style
    const style = document.createElement('style');
    document.head.appendChild(style);

    function updateStyle() {
        style.textContent = baseBorderStyle + (displayNames ? displayNameStyle : '');
    }

    function expand(event, element) {
        event?.preventDefault();
        event?.stopPropagation();

        element.style = '';
        event && element.scrollIntoView();
        element.onclick = null;
    }
    function collapse(el, shouldCollapse) {
        if (!shouldCollapse) {
            expand(null, el);
            return;
        }

        el.style = `height:30px;overflow:hidden;cursor:pointer;`;
        el.onclick = (e) => expand(e, el);
    }

    function collapseGalleryIfNeeded() {
        if (window.location.href.includes('.org/g/')) {
            const commentSection = document.querySelector('#cdiv');
            if (commentSection) collapse(commentSection, collapseGallery);

            const galleryInfo = document.querySelector('div.gm:has(#gmid)');
            if (galleryInfo) collapse(galleryInfo, collapseGallery);
        }
    }

    const createButton = (title) => {
        const button = document.createElement('button');
        button.innerText = title;
        button.style = `bottom: 0; background: #1f1f69; color: white;
border: none; padding: 6px 12px; cursor: pointer; margin-left: 20px;`;

        return button;
    };

    const btnTitle = {
        true: ' [on]',
        false: ' [off]',
    };
    function addControls() {
        const titleBtn = createButton('Toggle image titles' + btnTitle[displayNames]);
        titleBtn.onclick = () => {
            displayNames = !displayNames;
            localStorage.setItem(STORAGE_KEYS.displayNames, `${displayNames}`);
            updateStyle();
            titleBtn.innerText = 'Toggle image titles' + btnTitle[displayNames];
        };

        const collapseGalleryBtn = createButton('Collapse gallery and comments' + btnTitle[collapseGallery]);
        collapseGalleryBtn.onclick = () => {
            collapseGallery = !collapseGallery;
            localStorage.setItem(STORAGE_KEYS.collapseGallery, `${collapseGallery}`);
            collapseGalleryIfNeeded();
            collapseGalleryBtn.innerText = 'Collapse gallery and comments' + btnTitle[collapseGallery];
        };

        document.body.appendChild(titleBtn);
        document.body.appendChild(collapseGalleryBtn);
    }

    updateStyle();

    if (/e(?:-|x)h(?:e)nt.i\.org/.test(window.location.host)) {
        addControls();
        collapseGalleryIfNeeded();
    }
})();
