const fs = require('fs');
const path = require('path');
const { removeBackground } = require('@imgly/background-removal-node');
const { execSync } = require('child_process');

// DIRECTORIES
const VIDEO_DIR = path.join(__dirname, '../Videos');
const OUTPUT_DIR = path.join(__dirname, '../public/tico/videos');
const TEMP_DIR = path.join(__dirname, '../temp_frames_ai');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// CONFIGURATION
// Tico videos to process
const VIDEOS = [
    { name: 'tico_idle_animation' },
    { name: 'tico_pecking_action' }
];

async function processVideoAI(videoName) {
    console.log(`🎬 Processing (AI Segmentation): ${videoName}`);

    const framesDir = path.join(TEMP_DIR, videoName);
    if (fs.existsSync(framesDir)) {
        execSync(`del /Q "${framesDir}\\*"`, { stdio: 'ignore' });
    } else {
        fs.mkdirSync(framesDir);
    }

    // 1. EXTRACT FRAMES
    // We use ffmpeg to get PNG frames
    console.log('   📸 Extracting frames...');
    execSync(`ffmpeg -i "${path.join(VIDEO_DIR, videoName + '.mp4')}" -vf "fps=24" "${path.join(framesDir, 'frame_%04d.png')}"`, { stdio: 'ignore' });

    // 2. PROCESS FRAMES WITH AI
    // 2. PROCESS FRAMES WITH AI
    const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.png')).sort();
    console.log(`   🤖 Segmentation in progress (${files.length} frames)... This may take a while.`);

    let count = 0;

    // config for @imgly/background-removal-node
    const config = {
        debug: false,
        model: 'medium',
        output: {
            format: 'image/png',
            quality: 1.0
        }
    };

    for (const file of files) {
        const filePath = path.join(framesDir, file);
        // Fix for Windows: Convert to file URL
        const fileUrl = 'file://' + filePath.replace(/\\/g, '/');

        try {
            // Remove Background
            const blob = await removeBackground(fileUrl, config);

            // Convert Blob to Buffer
            const arrayBuffer = await blob.arrayBuffer();
            let buffer = Buffer.from(arrayBuffer);

            // POST-PROCESS: Add a tiny bit of dilation/smoothing to the alpha channel
            // This helps with "disappearing" thin parts by slightly expanding the mask
            // and smoothing edges.
            const sharp = require('sharp');
            buffer = await sharp(buffer)
                .png()
                .ensureAlpha()
                .unflatten()
                .gamma(1.5) // Slightly boost alpha visibility
                .toBuffer();

            fs.writeFileSync(filePath, buffer);

            count++;
            if (count % 5 === 0) process.stdout.write(`.`);
        } catch (error) {
            console.error(`\n   ❌ Error frame ${file}:`, error.message);
        }
    }
    console.log('\n   ✨ Segmentation Complete.');

    // 3. REASSEMBLE TO WEBM
    console.log('   🎥 Encoding WebM (VP9 + Alpha)...');
    const outputPath = path.join(OUTPUT_DIR, videoName + '.webm');

    // Using simple ffmpeg command to stitch frames back
    execSync(`ffmpeg -y -framerate 24 -i "${path.join(framesDir, 'frame_%04d.png')}" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 1000k -auto-alt-ref 0 "${outputPath}"`, { stdio: 'ignore' });

    console.log(`   ✅ Done: ${outputPath}`);
}

async function run() {
    console.log("🚀 Starting AI Background Removal Pipeline...");
    console.log("---------------------------------------------");

    for (const v of VIDEOS) {
        await processVideoAI(v.name);
    }

    console.log("\n🏁 All videos processed successfully!");
}

run().catch(console.error);
