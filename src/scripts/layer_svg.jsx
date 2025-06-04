var filepath = arguments[0];
var layerName = arguments[1];

try {
    // Create the output file
    // Get the dir from arguments
    var outputFile = new File(filepath);
    outputFile.lineFeed = "Unix";
    outputFile.open("w");
    
    // Check if there are any layers
    if (doc.layers.length > 0) {
        var layer;
        for (var i = 0; i < doc.layers.length; i++) {
            // if name matches set layer
            if (doc.layers[i].name === layerName) {
                layer = doc.layers[i];
                break;
            }
        }
        if (!layer) {
            outputFile.writeln("ERROR: Layer not found");
            exit;
        }
        
        // Create a temporary file to save the SVG
        var tempFile = File(Folder.temp + "/temp_layer_export.svg");
        
        // Hide all layers except the first one
        var visibilityState = [];
        for (var i = 0; i < doc.layers.length; i++) {
            visibilityState.push(doc.layers[i].visible);
            doc.layers[i].visible = (i === 0); // Only first layer is visible
        }
        
        // Set up SVG export options
        var exportOptions = new ExportOptionsSVG();
        exportOptions.embedRasterImages = false;
        exportOptions.cssProperties = SVGCSSPropertyLocation.STYLEATTRIBUTES;
        exportOptions.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
        exportOptions.documentEncoding = SVGDocumentEncoding.UTF8;
        exportOptions.preserveEditability = false; // Set to false for cleaner SVG output
        
        // Export only the visible layer (first layer)
        doc.exportFile(tempFile, ExportType.SVG, exportOptions);
        
        // Restore layer visibility
        for (var i = 0; i < doc.layers.length; i++) {
            doc.layers[i].visible = visibilityState[i];
        }
        
        // Read the SVG file content
        tempFile.open("r");
        var svgContent = tempFile.read();
        tempFile.close();
        
        // Delete the temporary file
        tempFile.remove();
        
        // Write the SVG content to the output file
        outputFile.write(svgContent);
    } else {
        outputFile.writeln("ERROR: The document has no layers");
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
