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
const STITCH_PROJECT_ID = "5427915925740667999";
// The ID that definitely had a screenshot in previous logs
const SCREEN_ID = "06ed0ecb94064f5a8e17118d696d0743";

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
        console.log(`Fetching screenshot for ${SCREEN_ID}...`);
        const screenRes = await callStitchAPI("tools/call", {
            name: "get_screen",
            arguments: { projectId: STITCH_PROJECT_ID, screenId: SCREEN_ID }
        }, GOOGLE_CLOUD_PROJECT_ID);

        let imageUrl = null;
        if (screenRes.result && screenRes.result.structuredContent && screenRes.result.structuredContent.screenshot && screenRes.result.structuredContent.screenshot.downloadUrl) {
            imageUrl = screenRes.result.structuredContent.screenshot.downloadUrl;
        }

        if (imageUrl) {
            console.log("Found image URL. Downloading...");
            const res = await fetch(imageUrl);
            const buffer = await res.arrayBuffer();
            fs.writeFileSync("stitch_design.png", Buffer.from(buffer));
            console.log("SUCCESS: Saved to stitch_design.png");
        } else {
            console.log("No screenshot found.");
        }

    } catch (e) {
        console.error(e);
    }
}

main();
