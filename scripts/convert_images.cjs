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

const images = getFiles('public', f => /\.(png|jpg|jpeg)$/i.test(f));
console.log(`Convirtiendo ${images.length} imagenes a WebP...`);

let totalBefore = 0;
let totalAfter = 0;
let count = 0;

for (const img of images) {
  const ext = path.extname(img);
  const out = img.slice(0, -ext.length) + '.webp';
  const sizeBefore = fs.statSync(img).size;
  totalBefore += sizeBefore;

  const res = spawnSync('ffmpeg', ['-y', '-i', img, '-c:v', 'libwebp', '-quality', '85', out], { stdio: 'ignore' });
  if (res.status === 0 && fs.existsSync(out)) {
    const sizeAfter = fs.statSync(out).size;
    totalAfter += sizeAfter;
    count++;
    console.log(`[OK] ${path.basename(img)}: ${(sizeBefore / 1024 / 1024).toFixed(2)} MB -> ${(sizeAfter / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error(`[ERROR] Fallo al convertir ${img}`);
  }
}

console.log('\n--- RESUMEN IMAGENES ---');
console.log(`Convertidas: ${count}/${images.length}`);
console.log(`Tamaño original: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
console.log(`Tamaño WebP: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
if (totalBefore > 0) {
  console.log(`Reducción: ${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%`);
}
