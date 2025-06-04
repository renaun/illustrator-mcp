// Script to get layers of the current document in JSON format

var json2 = File($.fileName).path + "/" + "json2.js";
 $.evalFile(json2);

var filepath = arguments[0];

try {
    // Create the output file
    // Get the dir from arguments
    var outputFile = new File(filepath);
    outputFile.lineFeed = "Unix";
    outputFile.open("w");
    
    // Check if a document is open
    if (app.documents.length > 0) {
        var doc = app.activeDocument;
        
        // Check if there are any layers
        if (doc.layers.length > 0) {
            // Loop over the layers and create an Object with the name and type
            // what other layer info is available?
            var layers = [];
            for (var i = 0; i < doc.layers.length; i++) {
                layers.push({name: doc.layers[i].name, type: doc.layers[i].typename, visible: doc.layers[i].visible, locked: doc.layers[i].locked, lockedObjects: doc.layers[i].lockedObjects});
            }
            outputFile.writeln(JSON.stringify(layers, null, 2));
        } else {
            outputFile.writeln("ERROR: The document has no layers");
        }
    } else {
        outputFile.writeln("ERROR: No documents are open");
    }
} catch (e) {
    // Create the output file if it doesn't exist yet
    if (!outputFile || !outputFile.exists) {
        outputFile = new File(filepath);
        outputFile.open("w");
    }
    outputFile.writeln("ERROR: " + e);
    // Close the output file if it's open
    if (outputFile && outputFile.exists) {
        outputFile.close();
    }
} finally {
    // Close the output file if it's open
    if (outputFile && outputFile.exists) {
        outputFile.close();
    }
}
