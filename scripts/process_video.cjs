const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const VIDEO_DIR = path.join(__dirname, '../Videos');
const OUTPUT_DIR = path.join(__dirname, '../public/tico/videos');
const TEMP_DIR = path.join(__dirname, '../temp_frames');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configuration
const VIDEOS = [
    { name: 'tico_idle_animation', loop: true },
    { name: 'tico_pecking_action', loop: false }
];

async function processVideo(videoName) {
    console.log(`🎬 Processing: ${videoName}`);
    const framesDir = path.join(TEMP_DIR, videoName);
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    // 1. Clean previous run
    execSync(`del /Q "${framesDir}\\*"`, { stdio: 'ignore' });

    // 2. Extract frames (full fidelity)
    console.log('   📸 Extracting frames...');
    execSync(`ffmpeg -i "${path.join(VIDEO_DIR, videoName + '.mp4')}" -vf "fps=24" "${path.join(framesDir, 'frame_%04d.png')}"`);

    // 3. Process each frame (Crop Black Bars + Smart Chroma Key)
    const files = fs.readdirSync(framesDir).sort();
    console.log(`   🎨 Processing ${files.length} frames (Crop + Alpha)...`);

    for (const file of files) {
        const filePath = path.join(framesDir, file);

        // Load image
        let image = sharp(filePath);
        const metadata = await image.metadata();

        // A. Crop Black Bars (Heuristic: Cut 15% from sides if it's wide)
        // Adjust these values based on actual footage if needed
        const cropOptions = {
            left: Math.floor(metadata.width * 0.15),
            top: 0,
            width: Math.floor(metadata.width * 0.7),
            height: metadata.height
        };

        // B. Smart Chroma Key (Remove external white, keep internal)
        // Strategy: Flood fill from corners? Or color range?
        // Since Tico has white belly, simple color replacement is dangerous.
        // We will try a "Fuzz" approach on specific white color #FFFFFF
        // Note: For complex segmentation without ML, we rely on the fact that background is PURE white #FFFFFF
        // and internal detail might be slightly off-white or enclosed.

        // SIMPLIFIED APPROACH: Convert near-white and black-bars to transparent
        // Using `toColorspace('srgb')` and `ensureAlpha()`

        // Convert to Buffer to manipulate pixels directly (Basic implementation)
        const { data, info } = await image
            .extract(cropOptions)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const pixelData = new Uint8Array(data);

        // Target Color: #dcdde1 (RGB: 220, 221, 225)
        const targetR = 220;
        const targetG = 221;
        const targetB = 225;

        // Tolerance: ~10-15% distance in 3D color space
        // Max distance in RGB cube is sqrt(255^2 * 3) ≈ 441
        // 10% of 441 is ~44. Let's use 45-50.
        const threshold = 45;
        const feather = 15; // Smooth transition zone

        for (let i = 0; i < pixelData.length; i += 4) {
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];

            // Calculate Euclidean distance from target color
            const dist = Math.sqrt(
                Math.pow(r - targetR, 2) +
                Math.pow(g - targetG, 2) +
                Math.pow(b - targetB, 2)
            );

            if (dist < threshold) {
                // Exact match within tolerance -> Fully transparent
                pixelData[i + 3] = 0;
            } else if (dist < threshold + feather) {
                // Feather zone -> Semi-transparent (Linear fade)
                // dist = threshold -> alpha = 0
                // dist = threshold + feather -> alpha = 255
                const alpha = Math.floor(((dist - threshold) / feather) * 255);
                pixelData[i + 3] = alpha;
            }
            // Else: Keep original alpha (opaque)
        }

        await sharp(pixelData, { raw: { width: info.width, height: info.height, channels: 4 } })
            .toFile(filePath); // Overwrite
    }

    // 4. Reassemble to WebM (VP9 + Alpha)
    console.log('   🎥 Encoding WebM...');
    const outputPath = path.join(OUTPUT_DIR, videoName + '.webm');

    // Command explanation:
    // -c:v libvpx-vp9: Codec VP9 (best for web alpha)
    // -pix_fmt yuva420p: Pixel format with Alpha channel
    // -b:v 1M: Bitrate
    // -auto-alt-ref 0: Better transparency handling
    execSync(`ffmpeg -y -framerate 24 -i "${path.join(framesDir, 'frame_%04d.png')}" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 1000k -auto-alt-ref 0 "${outputPath}"`);

    console.log(`   ✅ Done: ${outputPath}`);
}

async function run() {
    for (const v of VIDEOS) {
        await processVideo(v.name);
    }
    console.log('✨ All videos processed!');
}

run().catch(console.error);
