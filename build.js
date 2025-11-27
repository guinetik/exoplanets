import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get current directory (equivalent to __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, './dist');

// 1. Add CNAME for custom domain
fs.writeFileSync(path.join(distPath, 'CNAME'), 'exoplanets.guinetik.com');

// 2. Copy ./data to /dist/data
if (fs.existsSync('./data')) {
  copyFolderSync('./data', path.join(distPath, 'data'));
}

// 3. Copy ./public to /dist/public (for shaders and other static assets)
if (fs.existsSync('./public')) {
  copyFolderSync('./public', path.join(distPath, 'public'));
}

console.log('✅ Deployment prep complete!');

// Helper function (unchanged)
function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  fs.readdirSync(src).forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    fs.lstatSync(srcPath).isDirectory()
      ? copyFolderSync(srcPath, destPath)
      : fs.copyFileSync(srcPath, destPath);
  });
}
