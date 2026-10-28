const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const targetDirs = [
  'public/tico/Videos skin click',
  'public/tico/Videos skin picando'
];

let videos = [];
for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.mp4'));
  for (const file of files) {
    videos.push({
      dir,
      file,
      input: path.join(dir, file),
      output: path.join(dir, path.basename(file, path.extname(file)) + '.webm')
    });
  }
}

console.log(`Iniciando procesamiento de ${videos.length} videos (recorte 720x720 + transparencia colorkey)...`);

let completed = 0;
const startTime = Date.now();

for (let i = 0; i < videos.length; i++) {
  const v = videos[i];
  const sizeBefore = fs.statSync(v.input).size;
  console.log(`\n[${i + 1}/${videos.length}] Procesando "${v.file}" (${(sizeBefore / 1024 / 1024).toFixed(2)} MB)...`);

  const args = [
    '-y',
    '-i', v.input,
    '-vf', 'crop=720:720:280:0,colorkey=0xf606e5:0.25:0.04,format=yuva420p',
    '-c:v', 'libvpx-vp9',
    '-cpu-used', '5',
    '-row-mt', '1',
    '-threads', '4',
    '-b:v', '0',
    '-crf', '30',
    '-c:a', 'libopus',
    v.output
  ];

  const res = spawnSync('ffmpeg', args, { stdio: 'ignore' });

  if (res.status === 0 && fs.existsSync(v.output)) {
    const sizeAfter = fs.statSync(v.output).size;
    completed++;
    console.log(`  -> [OK] Guardado como WebM cuadrado transparente: ${(sizeAfter / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error(`  -> [ERROR] Falló la conversión de "${v.file}"`);
  }
}

const elapsedSec = Math.round((Date.now() - startTime) / 1000);
console.log(`\n========================================`);
console.log(`Finalizado: ${completed}/${videos.length} videos procesados en ${elapsedSec}s.`);
console.log(`========================================`);
