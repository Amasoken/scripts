/**********************************************************
Trace everything possible or so. Create vector from every raster layer.

This script was created because Adobe Illustrator couldn't save
auto actions with properly applied traced preset - it was always using the default tracing preset.

Created by @amasoken on 06 Dec 2021
*********************************************************/

// app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

var TRACING_PRESET = 'CAT'; // YOUR PRESET NAME
var NAME_REGEX = / Изображение| Image/;

function main() {
    var doc = app.activeDocument;
    traceLayers(doc.layers); // make raster into vector
    renameLayers(doc.layers); // remove 'Image' from layer names
    addBackgroundLayer(doc.layers); // Add a square to the bottom
}

main();

// ============================================================================

function addBackgroundLayer(layers) {
    var layer = layers.add();
    layer.name = 'background';
    var min = 0,
        max = 600;

    var lineList = [
        [min, min],
        [max, min],
        [max, max],
        [min, max],
    ];
    var color = new RGBColor();
    color.red = 255;
    color.green = 85;
    color.blue = 100;

    newPath = app.activeDocument.pathItems.add();
    newPath.filled = true;
    newPath.fillColor = color;
    newPath.setEntirePath(lineList);
    layer.zOrder(ZOrderMethod.SENDTOBACK);
}

// ============================================================================

function makeVisible(item) {
    if (item.visible === false) item.visible = true;
    if (item.hidden === true) item.hidden = false;
}

// ============================================================================

function traceItem(item) {
    item.trace();
    item.tracing.tracingOptions.loadFromPreset(TRACING_PRESET);
    item.tracing.expandTracing();
}

function tracePageItems(items) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        makeVisible(item);

        var trace = item.tracing ? item : item.trace();
        trace.tracing.tracingOptions.loadFromPreset(TRACING_PRESET);
        trace.tracing.expandTracing();
    }
}

function traceLayers(layers) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        makeVisible(layer);

        // traced items and such
        if (layer.pluginItems.length) {
            tracePageItems(layer.pluginItems);
        }

        // raster layers
        if (layer.rasterItems.length) {
            tracePageItems(layer.rasterItems);
        }

        if (layer.layers.length) {
            traceLayers(layer.layers);
        }
    }
}

// ============================================================================

function renameLayers(layers) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        renameEntity(layer);

        if (layer.layers.length) renameLayers(layer.layers);
        if (layer.pageItems.length) renamePageItems(layer.pageItems);
    }
}

function renameEntity(entity) {
    if (!entity || !entity.name) return;
    if (NAME_REGEX.test(entity.name)) {
        entity.name = entity.name.replace(NAME_REGEX, '');
    }
}

function renamePageItems(pageItems) {
    for (var i = 0; i < pageItems.length; i++) {
        var item = pageItems[i];
        renameEntity(item);
    }
}

// ============================================================================
