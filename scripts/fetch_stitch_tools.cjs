const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

// HARDCODED PATHS & CONFIG
const GCLOUD_PATH = "C:\\Users\\VALIMANA\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd";
// Pointing to the stitch-mcp installation to reuse node-fetch
const STITCH_MODULE_PATH = "C:\\Users\\VALIMANA\\AppData\\Roaming\\npm\\node_modules\\stitch-mcp";
const fetch = require(path.join(STITCH_MODULE_PATH, 'node_modules', 'node-fetch'));

const execAsync = promisify(exec);
const STITCH_URL = "https://stitch.googleapis.com/mcp";
const PROJECT_ID = "dashboard-docente-485619";

const log = {
    info: (msg) => console.error(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
};

async function runGcloud(params) {
    // USE ABSOLUTE PATH TO GCLOUD
    const fullCommand = `"${GCLOUD_PATH}" ${params}`;

    try {
        const { stdout } = await execAsync(fullCommand, {
            encoding: "utf8",
            maxBuffer: 10 * 1024 * 1024,
            timeout: 15000,
            windowsHide: true
        });
        return stdout.trim();
    } catch (error) {
        throw new Error(`Gcloud failed: ${error.message}`);
    }
}

async function getAccessToken() {
    return await runGcloud("auth application-default print-access-token");
}

async function callStitchAPI(method, params, projectId) {
    const token = await getAccessToken();

    const body = {
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now()
    };

    const response = await fetch(STITCH_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Goog-User-Project": projectId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data;
}

async function main() {
    try {
        console.log("Fetching tools list...");
        const result = await callStitchAPI("tools/list", {}, PROJECT_ID);

        if (result.result && result.result.tools) {
            console.log("\nFOUND TOOLS:");
            result.result.tools.forEach(t => {
                console.log(`- ${t.name}: ${t.description}`);
                console.log(`  Args: ${Object.keys(t.inputSchema.properties).join(", ")}`);
            });
        } else {
            console.log("No tools found in response:", JSON.stringify(result, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

main();
