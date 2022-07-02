/**********************************************************
Adobe illustrator script to make all the layers and everything visible.

Created by @amasoken on 06 Dec 2021
*********************************************************/

// app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

function main() {
    var doc = app.activeDocument;
    makeAllLayersVisible(doc.layers);
}

main();

// ============================================================================

function makeVisible(item) {
    if (item.visible === false) item.visible = true;
    if (item.hidden === true) item.hidden = false;
}

function makeEntitiesVisible(entities) {
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].visible === false) entities[i].visible = true;
        if (entities[i].hidden === true) entities[i].hidden = false;
    }
}

function checkLayer(layer) {
    if (layer.layers && layer.layers.length) makeAllLayersVisible(layer.layers);
    if (layer.pluginItems && layer.pluginItems.length) makeEntitiesVisible(layer.pluginItems);
    if (layer.rasterItems && layer.rasterItems.length) makeEntitiesVisible(layer.rasterItems);
    if (layer.pathItems && layer.pathItems.length) makeEntitiesVisible(layer.pathItems);
    if (layer.compoundPathItems && layer.compoundPathItems.length) makeEntitiesVisible(layer.compoundPathItems);
    if (layer.groupItems && layer.groupItems.length) {
        makeEntitiesVisible(layer.groupItems);
        for (var i = 0; i < layer.groupItems.length; i++) {
            var element = layer.groupItems[i];
            checkLayer(element);
        }
    }
}

function makeAllLayersVisible(layers) {
    makeEntitiesVisible(layers);

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        checkLayer(layer);
    }
}

// ============================================================================
