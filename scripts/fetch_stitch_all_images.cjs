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
const OUTPUT_DIR = "stitch_redesign";

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

async function downloadImage(url, filename) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), Buffer.from(buffer));
    console.log(`Saved ${filename}`);
}

async function main() {
    try {
        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

        console.log(`Fetching project details for ${STITCH_PROJECT_ID}...`);

        // Use get_project or list_projects to find screen instances
        const projRes = await callStitchAPI("tools/call", {
            name: "get_project",
            arguments: { name: `projects/${STITCH_PROJECT_ID}` }
        }, GOOGLE_CLOUD_PROJECT_ID);

        let screens = [];
        if (projRes.result && projRes.result.screenInstances) {
            screens = projRes.result.screenInstances;
        } else {
            console.log("No screenInstances found in get_project response. Trying list_projects fallback...");
            const listRes = await callStitchAPI("tools/call", {
                name: "list_projects",
                arguments: { filter: "view=owned" }
            }, GOOGLE_CLOUD_PROJECT_ID);
            // logic to find correct project in list
            if (listRes.result && listRes.result.structuredContent && listRes.result.structuredContent.projects) {
                const proj = listRes.result.structuredContent.projects.find(p => p.name.includes(STITCH_PROJECT_ID));
                if (proj && proj.screenInstances) screens = proj.screenInstances;
            }
        }

        if (screens.length === 0) { console.log("No screens found."); return; }

        console.log(`Found ${screens.length} screens. Processing...`);

        const processedIds = new Set();

        for (const screen of screens) {
            // screen.sourceScreen is like "projects/.../screens/ID"
            const screenId = screen.sourceScreen.split("/").pop();
            if (processedIds.has(screenId)) continue;
            processedIds.add(screenId);

            console.log(`Fetching details for ${screenId}...`);
            const screenRes = await callStitchAPI("tools/call", {
                name: "get_screen",
                arguments: { projectId: STITCH_PROJECT_ID, screenId: screenId }
            }, GOOGLE_CLOUD_PROJECT_ID);

            let imageUrl = null;
            if (screenRes.result) {
                if (screenRes.result.structuredContent && screenRes.result.structuredContent.screenshot && screenRes.result.structuredContent.screenshot.downloadUrl) {
                    imageUrl = screenRes.result.structuredContent.screenshot.downloadUrl;
                } else if (screenRes.result.screenshot && screenRes.result.screenshot.downloadUrl) {
                    imageUrl = screenRes.result.screenshot.downloadUrl;
                }
            }

            if (imageUrl) {
                await downloadImage(imageUrl, `screen_${screenId}.png`);
            } else {
                console.log(`No screenshot for ${screenId}`);
            }
        }
        console.log("Download complete.");

    } catch (e) {
        console.error(e);
    }
}

main();
