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

const CANDIDATE_IDS = [
    "f9cbbf8c919141fe8800cecc4cde9d0f",
    "8128bde801bb4652898ba4af87dcd74e",
    "2ac383de1c9f47e7a99693af18a686a2",
    "2130d4f86f48430db5ab624ab75f4a73",
    "15760abd1dc841129657308b5ea0e13b",
    "420b12f91554419d95e13bbe53ab4529",
    "ba20c752fc6d4276ac7afdd4b0d4c55f"
];

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
        console.log(`Starting brute-force search for HTML code...`);

        for (const id of CANDIDATE_IDS) {
            console.log(`Checking screen ID: ${id}`);
            const screenRes = await callStitchAPI("tools/call", {
                name: "get_screen",
                arguments: { projectId: STITCH_PROJECT_ID, screenId: id }
            }, GOOGLE_CLOUD_PROJECT_ID);

            // Check for HTML
            let htmlCode = null;
            if (screenRes.result && screenRes.result.htmlCode && screenRes.result.htmlCode.content) {
                htmlCode = screenRes.result.htmlCode.content;
            }

            if (htmlCode) {
                console.log(`\n!!! FOUND CODE IN ${id} !!!`);
                fs.writeFileSync("stitch_design.html", htmlCode);
                console.log("Saved to stitch_design.html");
                return; // Stop after finding one
            } else {
                console.log(`  - No HTML content.`);
            }
        }
        console.log("Finished search. No HTML code found in candidate list.");

    } catch (e) {
        console.error(e);
    }
}

main();
