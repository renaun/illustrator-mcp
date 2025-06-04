import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import { pino } from "pino";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { z } from "zod";
// Get the current directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logger = pino({
    transport: {
        target: "pino/file",
        options: { destination: "/Users/renaun/illustrator-mcp2.log" },
    },
});
const mcpServer = new McpServer({
    name: "illustrator-mcp",
    version: "1.0.0",
});
mcpServer.tool("mcp_illustrator_get_layers", "Get layers for a specific Illustrator file.", async ({}) => {
    var scriptName = "getlayers.jsx";
    const layers = JSON.parse(await callOAScript(scriptName, []));
    logger.info(layers);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(layers),
            },
        ],
    };
});
// Add mcp tool that gets the svg of a layer by name
mcpServer.tool("mcp_illustrator_get_layer_svg", "Get the svg of a layer by name", {
    layerName: z
        .string()
        .describe("The name of the layer to get the svg of"),
}, async ({ layerName }) => {
    var scriptName = "layer_svg.jsx";
    const svg = await callOAScript(scriptName, [layerName]);
    logger.info(`mcp_illustrator_get_layer_svg ${scriptName}, ${layerName}, ${svg}`);
    // base64 encode the svg
    const base64Svg = Buffer.from(svg).toString("base64");
    logger.info(base64Svg.slice(0, 100));
    return {
        content: [
            {
                type: "image",
                mimeType: "image/svg+xml",
                data: base64Svg,
            },
        ],
    };
});
async function callOAScript(scriptName, args) {
    const documentPath = join(__dirname, "..", "src", "scripts");
    // logger.info("callOAScript ", scriptName, documentPath);
    // Remove the .out file if it exists
    if (fs.existsSync(join(documentPath, scriptName + ".out"))) {
        // logger.info(`callOAScript removing ${scriptName}.out`);
        fs.unlinkSync(join(documentPath, scriptName + ".out"));
    }
    // Add ${documentPath}/${scriptName}.out to args as first arg
    args.unshift(`${documentPath}/${scriptName}.out`);
    // make each arg wrapped in quotes
    const argsString = args.map(arg => `"${arg}"`).join(", ");
    const script = `
    tell application "System Events"
        set frontmostApplicationName to name of 1st process whose frontmost is true
    end tell
    tell application "Adobe Illustrator"
        activate
        do javascript file "${documentPath}/${scriptName}" with arguments {${argsString}}
    end tell
    tell application frontmostApplicationName
        activate
    end tell
    `;
    const cmdResult = await exec(`osascript -e '${script}'`);
    //logger.info(`callOAScript result ${scriptName}, ${documentPath}, ${JSON.stringify(cmdResult)}`);
    while (!fs.existsSync(join(documentPath, scriptName + ".out"))) {
        // logger.info(`callOAScript waiting for ${scriptName}.out`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    while (fs.statSync(join(documentPath, scriptName + ".out")).size === 0) {
        // logger.info(`callOAScript waiting for ${scriptName}.out to be non-empty`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // logger.info(`callOAScript found ${scriptName}.out`, fs.readFileSync(join(documentPath, scriptName + ".out"), "utf8").slice(0, 100));
    return fs.readFileSync(join(documentPath, scriptName + ".out"), "utf8");
}
async function main() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    logger.info("Illustrator MCP server started 22");
}
main().catch((error) => {
    logger.error("Fatal error in learn-mcp main():", error);
    process.exit(1);
});
