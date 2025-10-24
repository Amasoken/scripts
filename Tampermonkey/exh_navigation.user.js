// ==UserScript==
// @name         Improve e-hentai navigation a bit
// @namespace    https://github.com/Amasoken/scripts
// @version      2025-10-24
// @description  Add border indicator to gif images, similar how it's done with video
// @author       Amasoken
// @match        https://exhentai.org/*
// @exclude      https://exhentai.org/gallerypopups*
// @match        https://e-hentai.org/*
// @exclude      https://e-hentai.org/gallerypopups*
// @grant        none
// @downloadURL  https://github.com/Amasoken/scripts/raw/master/Tampermonkey/exh_navigation.user.js
// @updateURL    https://github.com/Amasoken/scripts/raw/master/Tampermonkey/exh_navigation.user.js
// ==/UserScript==

(function () {
    const STORAGE_KEYS = {
        displayNames: 'userscript_display_img_title',
        collapseGallery: 'userscript_collapse_gallery_info',
        displayNav: 'userscript_display_navigation_buttons',
        enlargePagination: 'userscript_make_pagination_bigger',
    };

    const controls = {};
    for (const key in STORAGE_KEYS) {
        controls[key] = JSON.parse(localStorage.getItem(STORAGE_KEYS[key]) ?? 'false');
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
            if (commentSection) collapse(commentSection, controls.collapseGallery);

            const galleryInfo = document.querySelector('div.gm:has(#gmid)');
            if (galleryInfo) collapse(galleryInfo, controls.collapseGallery);
        }
    }

    const themes = {
        dark: {
            primaryBg: '#1f1f69',
            primaryColor: 'white',
            navBg: '#2b2b3b',
            navBgHover: '#2b2b3b',
            navColor: '#77787b',
            navColorHover: 'white',
        },
        light: {
            primaryBg: '#6c3b28',
            primaryColor: 'white',
            navBg: '#aba795',
            navBgHover: '#aba795',
            navColor: '#e3e0d1',
            navColorHover: 'white',
        },
    };

    const currentTheme = window.location.hostname.includes('-') ? 'light' : 'dark';
    const theme = themes[currentTheme];

    const createButton = (title) => {
        const button = document.createElement('button');
        button.innerText = title;
        button.style = `bottom: 0; background: ${theme.primaryBg}; color: ${theme.primaryColor};
border: none; padding: 6px 12px; cursor: pointer; margin-left: 20px;`;

        return button;
    };

    const setNavigationButtons = () => {
        let div = document.querySelector('.nav-controls');

        if (!div) {
            div = document.createElement('div');
            document.body.appendChild(div);
            div.className = 'nav-controls';

            [
                ['<', () => document.querySelector(`#uprev, td:has(+.ptds)>a, #prev`)?.click()],
                ['>', () => document.querySelector(`#unext, .ptds+td>a, #next`)?.click()],
            ].forEach(([t, cb]) => {
                const btn = document.createElement('button');
                btn.innerText = t;
                btn.onclick = cb;
                div.append(btn);
            });

            const style = document.createElement('style');
            document.head.appendChild(style);
            style.textContent = `.nav-controls button {
    position: fixed;
    top: 0;
    height: 100%;
    width: 179px;
    z-index: 2;
    color: ${theme.navColor};
    background: ${theme.navBg};
    border: none;
    cursor: pointer;
    font-size: xxx-large;
    font-weight: bold;
    opacity: 0.5;
    width: calc((100% - 1280px) / 2);
}

.nav-controls button:hover { background: ${theme.navBgHover}; color: ${theme.navColorHover}; }
.nav-controls button:nth-of-type(1) { left: 0; }
.nav-controls button:nth-of-type(2) { right: 0; }
`;
        }

        div.style.display = controls.displayNav ? 'block' : 'none';
    };

    // style
    const style = document.createElement('style');
    document.head.appendChild(style);

    function updateStyle() {
        style.textContent = '';

        if (controls.displayNames) {
            style.textContent += `#gdt div[title]::after { content: attr(title); display: inline-block;
background-color: ${theme.primaryBg}; color: ${theme.primaryColor}; width: 100%; font-size: 12px; padding: 0 0 5px 0; position: absolute;
top: -15px; left: -1px; border: 1px solid ${theme.primaryColor}; text-overflow: ellipsis; overflow: hidden; }
`;
        }

        if (controls.enlargePagination) {
            style.textContent += `.ptt td, .ptb td { zoom: 300%; opacity: 0.4; }`;
        }
    }

    const btnTitle = {
        true: ' [on]',
        false: ' [off]',
    };
    const controlButtons = [
        { title: 'Display image title', control: 'displayNames', action: updateStyle },
        { title: 'Collapse gallery and comments', control: 'collapseGallery', action: collapseGalleryIfNeeded },
        { title: 'Display side navigation', control: 'displayNav', action: setNavigationButtons },
        { title: 'Enlarge pagination', control: 'enlargePagination', action: updateStyle },
    ];
    function addControls() {
        const createAndAddButton = (title, controlName, cb) => {
            const btn = createButton(title + btnTitle[controls[controlName]]);
            btn.onclick = () => {
                controls[controlName] = !controls[controlName];
                localStorage.setItem(STORAGE_KEYS[controlName], `${controls[controlName]}`);
                btn.innerText = title + btnTitle[controls[controlName]];
                typeof cb === 'function' && cb();
            };

            document.body.appendChild(btn);
        };

        for (const btn of controlButtons) {
            createAndAddButton(btn.title, btn.control, btn.action);
        }
    }

    addControls();
    collapseGalleryIfNeeded();
    setNavigationButtons();
    updateStyle();
})();
