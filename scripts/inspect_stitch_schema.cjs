const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const GCLOUD_PATH = "C:\\Users\\VALIMANA\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd";
const STITCH_MODULE_PATH = "C:\\Users\\VALIMANA\\AppData\\Roaming\\npm\\node_modules\\stitch-mcp";
const fetch = require(path.join(STITCH_MODULE_PATH, 'node_modules', 'node-fetch'));

const execAsync = promisify(exec);
const STITCH_URL = "https://stitch.googleapis.com/mcp";
const GOOGLE_CLOUD_PROJECT_ID = "dashboard-docente-485619";

async function runGcloud(params) {
    const fullCommand = `"${GCLOUD_PATH}" ${params}`;
    try {
        const { stdout } = await execAsync(fullCommand, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024, timeout: 15000, windowsHide: true });
        return stdout.trim();
    } catch (error) { throw new Error(`Gcloud failed: ${error.message}`); }
}

async function getAccessToken() {
    return await runGcloud("auth application-default print-access-token");
}

async function callStitchAPI(method, params, projectId) {
    const token = await getAccessToken();
    const body = { jsonrpc: "2.0", method, params, id: Date.now() };
    const response = await fetch(STITCH_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "X-Goog-User-Project": projectId, "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    return await response.json();
}

async function main() {
    try {
        console.log("Fetching FULL tools schema...");
        const result = await callStitchAPI("tools/list", {}, GOOGLE_CLOUD_PROJECT_ID);

        if (result.result && result.result.tools) {
            fs.writeFileSync("stitch_tools_schema.json", JSON.stringify(result.result.tools, null, 2));
            console.log("Saved schema to stitch_tools_schema.json");

            // Check specifically for image input in generate
            const genTool = result.result.tools.find(t => t.name === 'generate_screen_from_text');
            if (genTool) {
                console.log("\nGenerate Screen Input Schema:");
                console.log(JSON.stringify(genTool.inputSchema, null, 2));
            }
        } else {
            console.log("No tools found.");
        }

    } catch (e) {
        console.error(e);
    }
}

main();
