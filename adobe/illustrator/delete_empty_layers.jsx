/**********************************************************
Remove all empty layers in Adobe Illustrator.

Created by @amasoken on 02 Jul 2022
*********************************************************/

// app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

function main() {
    var doc = app.activeDocument;
    while (removeEmptyLayers(doc.layers)) {}
}

main();

// ============================================================================

function hasEmptyLayers(layer) {
    var hasContent =
        (layer.layers && layer.layers.length) ||
        (layer.pluginItems && layer.pluginItems.length) ||
        (layer.rasterItems && layer.rasterItems.length) ||
        (layer.pathItems && layer.pathItems.length) ||
        (layer.compoundPathItems && layer.compoundPathItems.length) ||
        (layer.groupItems && layer.groupItems.length);

    if (!hasContent) {
        layer.remove();
        return true;
    } else {
        if (layer.layers && layer.layers.length) return removeEmptyLayers(layer.layers);
        return false;
    }
}

function removeEmptyLayers(layers) {
    var hasEmpty = false;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (hasEmptyLayers(layer)) hasEmpty = true;
    }

    return hasEmpty;
}

// ============================================================================
