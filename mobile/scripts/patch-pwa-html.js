// mobile/scripts/patch-pwa-html.js
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const htmlFile = path.join(distDir, 'index.html');
const pubDir = path.resolve(__dirname, '../public');

// Copy public assets to dist
if (fs.existsSync(pubDir)) {
  const files = fs.readdirSync(pubDir);
  for (const f of files) {
    const src = path.join(pubDir, f);
    const dest = path.join(distDir, f);
    fs.copyFileSync(src, dest);
    console.log('[PWA] Copied', f, 'to dist/');
  }
}

if (!fs.existsSync(htmlFile)) {
  console.error('[PWA] index.html not found in dist/');
  process.exit(1);
}

let html = fs.readFileSync(htmlFile, 'utf8');

const pwaHead = `
    <!-- PWA & Mobile Web App Meta Tags -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="theme-color" content="#0F1115" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="LançaEnsaio" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').then(function(reg) {
            console.log('PWA ServiceWorker registered with scope:', reg.scope);
          }).catch(function(err) {
            console.warn('PWA ServiceWorker registration failed:', err);
          });
        });
      }
    </script>
</head>`;

if (!html.includes('manifest.json')) {
  html = html.replace('</head>', pwaHead);
  fs.writeFileSync(htmlFile, html);
  console.log('[PWA] Patched index.html with PWA tags and ServiceWorker registration');
} else {
  console.log('[PWA] index.html already contains manifest.json');
}
