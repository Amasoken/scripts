/**********************************************************
Export all the layers from PSD in order. // Export image grid from Photoshop
Use for saving sticker packs in psd where every sticker is on a separate layer
and the images are visually arranged in a grid.

WARNING: When saving images the window blinks a lot. Use with caution.

Created by @amasoken on 4 Dec 2023
*********************************************************/

function main() {
    var doc = app.activeDocument;

    promptForSettings(function (params) {
        if (!params) {
            return;
        }

        if (params.makeLayersVisible) {
            setVisibilityForAllLayers(doc, true);
        }

        if (params.changeLayerOrder || params.alignImagesToGrid) {
            var allLayers = getAllLayers(doc);
            var layerRows = getLayerRows(allLayers); // intersecting images in a row, array of arrays

            if (params.alignImagesToGrid) translateLayersByGrid(layerRows, params.padding);
            if (params.changeLayerOrder) orderLayersByGrid(layerRows);
        }

        if (params.exportPNGs) {
            saveLayers(getAllLayers(doc));
        }
    });
}

main();

// ============================================================================

function promptForSettings(cb) {
    var params = {
        padding: 20,
        makeLayersVisible: true,
        alignImagesToGrid: true,
        changeLayerOrder: true,
        exportPNGs: false,
    };

    var dialog = new Window('dialog', 'Parameters');
    dialog.alignChildren = 'left';

    dialog.add('statictext', undefined, 'Grid padding:');
    var inputField1 = dialog.add('edittext');
    inputField1.text = params.padding;
    inputField1.characters = 10;

    function addCheckbox(label, value) {
        var checkbox = dialog.add('checkbox', undefined, label);
        checkbox.value = value;

        return checkbox;
    }

    var checkboxCollection = {
        makeLayersVisible: addCheckbox('MAKE ALL LAYERS VISIBLE (recommended)', params.makeLayersVisible),
        alignImagesToGrid: addCheckbox('ALIGN LAYERS TO GRID (change coordinates)', params.alignImagesToGrid),
        changeLayerOrder: addCheckbox('REORDER LAYERS. Row by row, left to right', params.changeLayerOrder),
        exportPNGs: addCheckbox('SAVE EACH LAYER as a separate PNG', params.exportPNGs),
    };

    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = 'right';
    var okButton = buttonGroup.add('button', undefined, 'OK');
    var cancelButton = buttonGroup.add('button', undefined, 'Cancel');

    okButton.onClick = function () {
        var paddingValue = parseInt(inputField1.text);

        if (!isNaN(paddingValue) && paddingValue >= 0) {
            params.padding = paddingValue;

            params.makeLayersVisible = checkboxCollection.makeLayersVisible.value;
            params.alignImagesToGrid = checkboxCollection.alignImagesToGrid.value;
            params.changeLayerOrder = checkboxCollection.changeLayerOrder.value;
            params.exportPNGs = checkboxCollection.exportPNGs.value;

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

function saveLayers(layers) {
    var folderPath = Folder.selectDialog('Please select a folder to save the layers into');

    if (!folderPath) {
        alert('No folder selected. Please select a folder to save the layers into.');
        return;
    }

    var currentDoc = app.activeDocument;
    var resolution = currentDoc.resolution;
    var colorProfile = currentDoc.colorProfileName;

    var exportOptions = new ExportOptionsSaveForWeb();
    exportOptions.format = SaveDocumentType.PNG;
    exportOptions.PNG8 = false;
    exportOptions.transparency = true;

    var layerCount = 1;

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        currentDoc.activeLayer = layer; // visual progress indicaton, nothing more

        var position = getLayerPosition(layer);
        var width = position.x2 - position.x1;
        var height = position.y2 - position.y1;

        var prefix = '000' + layerCount++;
        var name = prefix.substring(prefix.length - 3) + '_' + layer.name;

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
        layer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);

        var filePath = folderPath + '\\' + name + '.png';
        app.activeDocument = newDoc;
        newDoc.exportDocument(new File(filePath), ExportType.SAVEFORWEB, exportOptions);
        newDoc.close(SaveOptions.DONOTSAVECHANGES);
    }
}

// ============================================================================

function getAllLayers(entity, _layers) {
    var layerList = _layers || [];

    if (entity && entity.layers) {
        for (var i = 0; i < entity.layers.length; i++) {
            getAllLayers(entity.layers[i], layerList);
        }
    } else {
        layerList.push(entity);
    }

    if (!_layers) {
        return layerList;
    }
}

// ============================================================================

function getLayerRows(layersToSort) {
    var orderedLayers = layersToSort.slice();

    // Sort by height
    orderedLayers.sort(function (a, b) {
        var pos1 = getLayerPosition(a);
        var pos2 = getLayerPosition(b);
        return pos1.y1 - pos2.y1;
    });

    // Distribute by rows, comparing intersecting images
    var layerRows = [];
    var nextRow = [];

    for (var i = 0; i < orderedLayers.length; i++) {
        if (i === 0) {
            nextRow.push(orderedLayers[0]);
        } else if (hasIntersectionByY(orderedLayers[i], orderedLayers[i - 1])) {
            nextRow.push(orderedLayers[i]);
        } else {
            layerRows.push(nextRow);
            nextRow = [orderedLayers[i]];
        }
    }

    // When you have one row and it's not recorded yet
    if (nextRow.length && layerRows[layerRows.length - 1] !== nextRow) layerRows.push(nextRow);

    for (var i = 0; i < layerRows.length; i++) {
        layerRows[i].sort(function (a, b) {
            if (a.bounds[0].value > b.bounds[0].value) return 1;
            return -1;
        });
    }

    return layerRows;
}

function hasIntersectionByY(layer1, layer2) {
    var pos1 = getLayerPosition(layer1);
    var pos2 = getLayerPosition(layer2);

    return pos2.y1 <= pos1.y2 && pos1.y1 <= pos2.y2;
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

// Change layers' position (coordinates)
function translateLayersByGrid(layerRows, padding) {
    var startingPosition = getLayerPosition(layerRows[0][0]);
    var layerSize = {
        x: startingPosition.x2 - startingPosition.x1,
        y: startingPosition.y2 - startingPosition.y1,
    };
    var spacePerLayer = {
        x: layerSize.x + padding,
        y: layerSize.y + padding,
    };

    for (var i = 0; i < layerRows.length; i++) {
        for (var j = 0; j < layerRows[i].length; j++) {
            translateLayer(
                layerRows[i][j],
                startingPosition.x1 + spacePerLayer.x * j,
                startingPosition.y1 + spacePerLayer.y * i,
                layerSize.x,
                layerSize.y
            );
        }
    }
}

// Change layers' order
function orderLayersByGrid(layerRows) {
    var previousLayer = null;

    for (var i = 0; i < layerRows.length; i++) {
        for (var j = 0; j < layerRows[i].length; j++) {
            if (!previousLayer) {
                previousLayer = layerRows[i][j];
                continue;
            }

            layerRows[i][j].moveAfter(previousLayer);
            previousLayer = layerRows[i][j];
        }
    }
}

// layer, top left coordinates, size of the first image for offset (to center an image)
function translateLayer(layer, x, y, sizeX, sizeY) {
    var currentPosition = getLayerPosition(layer);
    var diff = { x: x - currentPosition.x1, y: y - currentPosition.y1 };
    var sizeOffset = {
        x: Math.round((sizeX - (currentPosition.x2 - currentPosition.x1)) / 2),
        y: Math.round((sizeY - (currentPosition.y2 - currentPosition.y1)) / 2),
    };
    layer.translate(diff.x + sizeOffset.x, diff.y + sizeOffset.y);
}

// ============================================================================
