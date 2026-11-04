import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');

const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find((f) => f.endsWith('.css'));
const jsFile = assetFiles.find((f) => f.endsWith('.js'));

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

const standaloneHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UNRC · Coordinación de Proyectos y Conversación</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@400;500;600&family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
      rel="stylesheet"
    />
    <style>${cssContent}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${jsContent.replace(/<\/script>/gi, '<\\/script>')}</script>
  </body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'backend-gas', 'Index.html'), standaloneHtml, 'utf8');
fs.writeFileSync(path.join(distDir, 'unrc-app-standalone.html'), standaloneHtml, 'utf8');
console.log('Generated standalone Index.html successfully:', standaloneHtml.length, 'bytes');
