const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getFiles(dir, filter) {
  let res = [];
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) res = res.concat(getFiles(full, filter));
      else if (filter(f.name)) res.push(full);
    }
  } catch (e) {}
  return res;
}

const videos = getFiles('public', f => /\.mp4$/i.test(f));
console.log(`Convirtiendo ${videos.length} videos a WebM (VP9)...`);

let totalBefore = 0;
let totalAfter = 0;
let count = 0;

for (let i = 0; i < videos.length; i++) {
  const vid = videos[i];
  const ext = path.extname(vid);
  const out = vid.slice(0, -ext.length) + '.webm';
  const sizeBefore = fs.statSync(vid).size;
  totalBefore += sizeBefore;

  console.log(`[${i + 1}/${videos.length}] Procesando ${path.basename(vid)} (${(sizeBefore / 1024 / 1024).toFixed(2)} MB)...`);

  // -c:v libvpx-vp9 -crf 32 -b:v 0 -c:a libopus -threads 4
  const res = spawnSync('ffmpeg', [
    '-y',
    '-i', vid,
    '-c:v', 'libvpx-vp9',
    '-crf', '32',
    '-b:v', '0',
    '-c:a', 'libopus',
    '-threads', '4',
    out
  ], { stdio: 'ignore' });

  if (res.status === 0 && fs.existsSync(out)) {
    const sizeAfter = fs.statSync(out).size;
    totalAfter += sizeAfter;
    count++;
    console.log(`  -> [OK] Listo: ${(sizeAfter / 1024 / 1024).toFixed(2)} MB (-${(((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1)}%)`);
  } else {
    console.error(`  -> [ERROR] Fallo al convertir ${vid}`);
  }
}

console.log('\n--- RESUMEN VIDEOS ---');
console.log(`Convertidos: ${count}/${videos.length}`);
console.log(`Tamaño original: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
console.log(`Tamaño WebM: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
if (totalBefore > 0) {
  console.log(`Reducción: ${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%`);
}
