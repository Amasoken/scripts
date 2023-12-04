/**********************************************************
Reduce the amount of useless layers. Remove layers that contain only one layer or folder.

Created by @amasoken on 05 Jul 2022
*********************************************************/

// app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

var NAME_REGEX = /Layer \d+|Folder \d+/;

function main() {
    var doc = app.activeDocument;

    makeAllLayersVisible(doc.layers);
    while (removeLayersIndent(doc.layers)) {}
    while (removeEmptyLayers(doc.layers)) {}
    renameLayersAndGroups(doc.layers);
}

main();

// ============================================================================

function getElementsCount(layer) {
    var totalLayers = 0;
    totalLayers += (layer.layers && layer.layers.length) || 0;
    totalLayers += (layer.groupItems && layer.groupItems.length) || 0;
    totalLayers += (layer.pathItems && layer.pathItems.length) || 0;

    return totalLayers;
}

function handleSubLayer(layer) {
    var totalLayers = getElementsCount(layer);
    if (layer.layers && layer.layers.length === 1 && totalLayers === 1) {
        var subLayer = layer.layers[0];
        var isTopLevel = layer.parent === activeDocument;

        if (!isTopLevel) {
            subLayer.name = layer.name;
            subLayer.move(layer, ElementPlacement.PLACEAFTER);
            return true;
        }
    }

    return false;
}

function handleSubGroup(layer) {
    var totalLayers = getElementsCount(layer);
    if (layer.groupItems && layer.groupItems.length === 1 && totalLayers === 1) {
        var subGroup = layer.groupItems[0];
        var isTopLevel = layer.parent === activeDocument;

        if (!isTopLevel) {
            subGroup.name = layer.name;
            subGroup.move(layer, ElementPlacement.PLACEAFTER);

            return true;
        }
    }

    return false;
}

function handleGroups(layer) {
    var groups = layer.groupItems;
    if (!groups || !groups.length) return false;

    var hasChanges = handleSubGroup(layer);
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];

        if (handleSubGroup(group)) hasChanges = true;
        if (handleGroups(group)) hasChanges = true;
        if (!group.name) group.name = layer.name;
    }

    return hasChanges;
}

function removeLayersIndent(layers) {
    if (!layers || !layers.length) return false;

    var hasChanges = false;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (handleSubLayer(layer)) hasChanges = true;
        if (handleGroups(layer)) hasChanges = true;
        if (removeLayersIndent(layer.layers)) hasChanges = true;
    }

    return hasChanges;
}

// ============================================================================

function removeEmptyLayers(layers) {
    var hasEmpty = false;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (hasEmptyLayers(layer)) hasEmpty = true;
    }

    return hasEmpty;
}

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

// ============================================================================

function makeAllLayersVisible(layers) {
    makeEntitiesVisible(layers);

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        checkLayer(layer);
    }
}

function setVisibility(item) {
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

// ============================================================================

function renameLayersAndGroups(layers) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        renameEntity(layer);

        if (layer.layers && layer.layers.length) renameLayersAndGroups(layer.layers);
        if (layer.groupItems && layer.groupItems.length) renameLayersAndGroups(layer.groupItems);
    }
}

function renameEntity(entity) {
    if ((NAME_REGEX.test(entity.name) || !entity.name) && entity.parent && entity.parent.name) {
        entity.name = entity.parent.name;
    }
}

function renameItems(items) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        renameEntity(item);
    }
}

// ============================================================================
