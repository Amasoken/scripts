/**********************************************************
Combine groups of 2 images into one long wallpaper each. Export two screen wallpapers.

WARNING: When saving images the window blinks a lot. Use with caution.

Created by @amasoken on 6 Dec 2023
*********************************************************/

var GROUP_FOR_INVALID_GROUPS = 'INVALID_GROUPS';

var MAX_COLUMNS = 2;

function main() {
    var doc = app.activeDocument;

    promptForSettings(function (params) {
        if (!params) return;

        setVisibilityForAllLayers(doc, true);
        flattenGroups(doc);

        if (params.deleteEmpty) {
            removeEmptyGroups(doc);
        }

        var wallpaperGroups = validateGroups(doc);
        reorderGroups(wallpaperGroups);

        arrangeWallpaperGroups(wallpaperGroups, params);

        if (params.exportWallpapers) {
            exportWallpapers(wallpaperGroups);
        }
    });
}

main();

// ============================================================================

function promptForSettings(cb) {
    var params = {
        spacing: {
            padding: 150,
            columns: 2,
        },
        deleteEmpty: false,
        exportWallpapers: false,
    };

    var dialog = new Window('dialog', 'Parameters');
    dialog.alignChildren = 'left';

    dialog.add('statictext', undefined, 'Grid padding:');
    var inputField1 = dialog.add('edittext');
    inputField1.text = params.spacing.padding;
    inputField1.characters = 10;

    dialog.add('statictext', undefined, 'Column count:');
    var inputField2 = dialog.add('edittext');
    inputField2.text = params.spacing.columns;
    inputField2.characters = 10;

    var checkboxDeleteEmpty = dialog.add('checkbox', undefined, 'Delete empty groups!');
    checkboxDeleteEmpty.value = params.deleteEmpty;

    var checkboxExportImages = dialog.add('checkbox', undefined, 'Export wallpapers as PNG');
    checkboxExportImages.value = params.exportWallpapers;

    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = 'right';
    var okButton = buttonGroup.add('button', undefined, 'OK');
    var cancelButton = buttonGroup.add('button', undefined, 'Cancel');

    okButton.onClick = function () {
        var paddingValue = parseInt(inputField1.text);
        var columnsValue = parseInt(inputField2.text);

        if (!isNaN(paddingValue) && !isNaN(columnsValue) && paddingValue >= 0 && columnsValue >= 1) {
            params.spacing.padding = paddingValue;
            params.spacing.columns = columnsValue;
            params.deleteEmpty = checkboxDeleteEmpty.value;
            params.exportWallpapers = checkboxExportImages.value;

            dialog.close();
            cb(params);
        } else {
            alert('Invalid input. Please enter valid numbers (padding >= 0, columns >= 1).');
        }
    };

    cancelButton.onClick = function () {
        dialog.close();
        cb(null);
    };

    dialog.show();
}

// ============================================================================

function setVisibilityForAllLayers(entity, isVisible) {
    var layers = entity.layers;
    if (layers && layers.length) {
        for (var i = 0; i < layers.length; i++) {
            setVisibility(layers[i], isVisible);
            setVisibilityForAllLayers(layers[i], isVisible);
        }
    }
}

function setVisibility(item, isVisible) {
    var visible = isVisible;
    if (item.visible !== visible) item.visible = visible;
}

// ============================================================================

function exportWallpapers(groups) {
    var folderPath = Folder.selectDialog('Please select a folder to save the wallpapers into');

    if (!folderPath) {
        alert('No folder selected. Please select a folder to save the wallpapers into.');
        return;
    }

    var currentDoc = app.activeDocument;
    var resolution = currentDoc.resolution;
    var colorProfile = currentDoc.colorProfileName;

    var exportOptions = new ExportOptionsSaveForWeb();
    exportOptions.format = SaveDocumentType.PNG;
    exportOptions.PNG8 = false;
    exportOptions.transparency = true;

    for (var i = 0; i < groups.length; i++) {
        var currentGroup = groups[i];
        currentDoc.activeLayer = currentGroup; // visual progress indicaton, nothing more

        var position = getLayerPosition(currentGroup);
        var width = position.x2 - position.x1;
        var height = position.y2 - position.y1;

        var name = Date.now();

        var newDoc = app.documents.add(
            width,
            height,
            resolution,
            name,
            NewDocumentMode.RGB,
            DocumentFill.TRANSPARENT,
            1,
            BitsPerChannelType.EIGHT,
            colorProfile
        );

        app.activeDocument = currentDoc;
        currentGroup.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);

        var filePath = folderPath + '\\' + name + '.png';
        app.activeDocument = newDoc;

        // Fix coordinates not being 0,0 when duplicating
        var currentPosition = getLayerPosition(app.activeDocument.layerSets[0]);
        if (currentPosition.x1 !== 0 || currentPosition.y1 !== 0) {
            app.activeDocument.layerSets[0].translate(0 - currentPosition.x1, 0 - currentPosition.y1);
        }

        newDoc.exportDocument(new File(filePath), ExportType.SAVEFORWEB, exportOptions);
        newDoc.close(SaveOptions.DONOTSAVECHANGES);
    }
}

// ============================================================================

function flattenGroups(entity, _depth) {
    var depth = _depth || 0;

    for (var i = 0; i < entity.layerSets.length; i++) {
        var layerSet = entity.layerSets[i];
        if (layerSet.layerSets.length && layerSet.name !== GROUP_FOR_INVALID_GROUPS) {
            flattenGroups(layerSet, depth + 1);
        }
    }

    if (depth > 0) {
        layerSet.move(app.activeDocument, ElementPlacement.PLACEATBEGINNING);
    }
}

function removeEmptyGroups(entity) {
    var setsToRemove = [];

    for (var i = 0; i < entity.layerSets.length; i++) {
        var layerSet = entity.layerSets[i];
        if (layerSet.name === GROUP_FOR_INVALID_GROUPS) continue;
        if (!layerSet.artLayers.length) {
            setsToRemove.push(layerSet);
        }
    }

    for (var i = 0; i < setsToRemove.length; i++) {
        setsToRemove[i].remove();
    }
}

function validateGroups(entity) {
    var validGroups = [];
    var invalidLayers = [];

    for (var i = 0; i < entity.layerSets.length; i++) {
        var layerSet = entity.layerSets[i];
        if (layerSet.name === GROUP_FOR_INVALID_GROUPS) continue;

        if (isValidGroup(layerSet)) {
            validGroups.push(layerSet);
        } else {
            invalidLayers.push(layerSet);
        }
    }

    for (var i = 0; i < entity.artLayers.length; i++) {
        invalidLayers.push(entity.artLayers[i]);
    }

    groupInvalidLayers(invalidLayers);

    validGroups.sort(function (a, b) {
        return a.bounds[1].value - b.bounds[1].value;
    });

    return validGroups;
}

function groupInvalidLayers(layers) {
    var invalidGroupContainer;
    try {
        invalidGroupContainer = app.activeDocument.layerSets.getByName(GROUP_FOR_INVALID_GROUPS);
    } catch (err) {
        invalidGroupContainer = app.activeDocument.layerSets.add();
        invalidGroupContainer.name = GROUP_FOR_INVALID_GROUPS;
    }

    invalidGroupContainer.move(app.activeDocument, ElementPlacement.PLACEATEND);

    // Another workaround/hack since you can't just do what you're supposed to do.
    // You can't place group inside of a group using ElementPlacement.INSIDE
    // Expected result: it works since it's from official documentation
    // Actual result: you get Illegal Argument error with no proper explanation
    //
    // Hack: add a group inside of a group with .add(), place other groups BEFORE your temporary group, then remove it
    var anchor = invalidGroupContainer.layerSets.add();

    for (var i = 0; i < layers.length; i++) {
        var layerSet = layers[i];
        layerSet.move(anchor, ElementPlacement.PLACEBEFORE);
    }

    anchor.remove();
}

function isValidGroup(group) {
    return group.layerSets.length === 0 && group.artLayers.length === 2;
}

// ============================================================================

function reorderGroups(groups) {
    for (var i = 0; i < groups.length; i++) {
        orderImages(groups[i].artLayers);

        if (i > 0) {
            groups[i].move(groups[i - 1], ElementPlacement.PLACEAFTER);
        }
    }
}

function orderImages(layers) {
    if (layers[0].bounds[0].value > layers[1].bounds[0].value) {
        layers[0].move(layers[1], ElementPlacement.PLACEAFTER);
    }
}

// ============================================================================

function arrangeWallpaperGroups(groups, params) {
    var topLeft = {
        x: params.spacing.padding,
        y: params.spacing.padding,
    };

    var columnIndex = 0;

    for (var i = 0; i < groups.length; i++) {
        var layers = groups[i].artLayers;
        var posLayer1 = getLayerPosition(layers[0]);
        var posLayer2 = getLayerPosition(layers[1]);

        layers[1].translate(posLayer1.x2 - posLayer2.x1, posLayer1.y1 - posLayer2.y1);

        var groupPos = getLayerPosition(groups[i]);
        var groupWidth = groupPos.x2 - groupPos.x1;
        var groupHeight = groupPos.y2 - groupPos.y1;
        groups[i].translate(topLeft.x - groupPos.x1, topLeft.y - groupPos.y1);

        if (++columnIndex >= params.spacing.columns) {
            // shift down, start next row
            columnIndex = 0;
            topLeft.x = params.spacing.padding;
            topLeft.y = topLeft.y + groupHeight + params.spacing.padding;
        } else {
            // shift right
            topLeft.x = topLeft.x + groupWidth + params.spacing.padding;
        }
    }
}

function getLayerPosition(layer) {
    return {
        x1: layer.bounds[0].value,
        y1: layer.bounds[1].value,
        x2: layer.bounds[2].value,
        y2: layer.bounds[3].value,
    };
}

// ============================================================================
