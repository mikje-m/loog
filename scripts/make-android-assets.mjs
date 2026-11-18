// Source images for the Android launcher icon and splash screen (consumed by @capacitor/assets).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const out = (name) => fileURLToPath(new URL(`../assets/${name}`, import.meta.url));
const BG = '#0f0a0c';

// The artwork: a pink rounded square with the dumbbell (same as public/icon.svg, without the dark ground).
const art = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect x="96" y="96" width="320" height="320" rx="72" fill="#e901c4"/>
  <g transform="translate(136 136) scale(10)" fill="none" stroke="#000" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>
  </g>
</svg>`;

const withBackground = (size) =>
  sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: Buffer.from(art(size)), top: 0, left: 0 }])
    .png();

await withBackground(1024).toFile(out('icon-only.png'));
await sharp(Buffer.from(art(1024))).png().toFile(out('icon-foreground.png')); // transparent, inside the adaptive safe zone
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } }).png().toFile(out('icon-background.png'));

// Splash: the icon centred on the dark ground.
const splash = async (name) => {
  const size = 2732;
  const icon = await sharp(Buffer.from(art(720))).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: icon, gravity: 'center' }])
    .png()
    .toFile(out(name));
};
await splash('splash.png');
await splash('splash-dark.png');
console.log('android assets written');
