/**********************************************************
Export Adobe Illustrator layers as a separate files
Move layers to a separate folder as AI files in Adobe Illustrator

Created by @amasoken on 06 Dec 2021
*********************************************************/

// app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

var BASE_PATH = 'R:\\documents\\Drawings\\!!tmp\\'; // Path to YOUR folder to store the output

function main() {
    var doc = app.activeDocument;
    exportLayers(doc, doc.layers);
}

main();

// ============================================================================

// get all elements from a layer
function getElements(layer) {
    var elements = [];

    if (layer.pageItems.length) {
        for (var i = 0; i < layer.pageItems.length; i++) {
            var element = layer.pageItems[i];
            elements.push(element);
        }
    }

    if (layer.layers.length) {
        for (var j = 0; j < layer.layers.length; j++) {
            var subLayers = getElements(layer.layers[j]);
            elements = elements.concat(subLayers);
        }
    }

    return elements;
}

function moveToDocument(items, docName, folderName) {
    targetDoc = documents.add(DocumentColorSpace.RGB, sourceDoc.width, sourceDoc.height);
    targetLayer = targetDoc.layers.add();
    targetLayer.name = name; // rename

    for (var i = 0; i < items.length; i++) {
        sourcePageRef = items[i];
        dupRef = sourcePageRef.duplicate(targetDoc, ElementPlacement.PLACEATEND);

        // dupRef.moveToBeginning(targetLayer);
        // dupRef.position = sourcePageRef.position
    }

    targetDoc.layers[0].remove();
    targetDoc.layers[0].name = docName;

    var folderPath = BASE_PATH + folderName + '\\';

    var folder = new Folder(folderPath);
    if (!folder.exists) folder.create();

    var path = folderPath + docName + '.ai';
    var saveOptions = new IllustratorSaveOptions();
    var newFile = new File(path);
    targetDoc.saveAs(newFile, saveOptions);
    targetDoc.close();
}

function exportLayers(doc, layers) {
    sourceDoc = doc;
    var sourceDocName = sourceDoc.name.replace(/ /g, '_');
    sourceDocName = sourceDocName.slice(0, sourceDocName.length - 3);
    var folderName = Date.now() + '_' + sourceDocName;

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var elements = getElements(layer);
        var docIndex = '000' + (i + 1);
        var docName = docIndex.slice(docIndex.length - 3) + '_' + layer.name.replace(/ /g, '_');

        moveToDocument(elements, docName, folderName);
    }
}

// ============================================================================
