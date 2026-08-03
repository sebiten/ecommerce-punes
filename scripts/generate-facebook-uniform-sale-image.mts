import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const WIDTH = 1080;
const HEIGHT = 1350;
const PHOTO_WIDTH = 460;
const PHOTO_HEIGHT = 520;

const root = process.cwd();
const catalogDirectory = join(root, "public", "images", "uniforms", "catalog");
const qrSource = join(
  process.env.TEMP || process.env.TMP || root,
  "pilcheria-gloria-promo-qr.png"
);
const qrPath = join(root, "public", "pilcheria-gloria-promo-qr.png");
const outputPath = join(
  root,
  "public",
  "pilcheria-gloria-facebook-ultimos-talles.png"
);

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function preparePhoto(filename: string) {
  const mask = Buffer.from(`
    <svg width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT}">
      <rect width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT}" rx="30" fill="#fff"/>
    </svg>
  `);

  return sharp(join(catalogDirectory, filename))
    .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: "cover", position: "centre" })
    .modulate({ brightness: 1.02, saturation: 1.02 })
    .sharpen({ sigma: 0.6 })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

function wordmarkSvg() {
  return `
    <g transform="translate(70 83) scale(.82)" fill="#f9fbf3">
      <path fill-rule="evenodd" d="M34 8C16.2 8 4 21.2 4 40.5S16.2 73 34 73c7.3 0 13.3-2.2 18-6.7v2.5C52 79 45.8 84 34 84c-8.1 0-15.1-2.4-21.1-7.2L5.8 87C13.6 93 23 96 34.2 96 55.1 96 68 85 68 64.7V10H52v6.5C47.4 10.8 41.3 8 34 8Zm2 15.5c10 0 17 7.1 17 17s-7 17-17 17-17-7.1-17-17 7-17 17-17Z"/>
      <path d="M77 1h16v63.4c0 5.7 2.5 8.1 7.7 8.1h4.3v14H96c-12.7 0-19-7.1-19-21.2V1Z"/>
      <path fill-rule="evenodd" d="M136 8c-20.1 0-34 13.6-34 32.5S115.9 73 136 73s34-13.6 34-32.5S156.1 8 136 8Zm0 15.5c10.4 0 18 7.1 18 17s-7.6 17-18 17-18-7.1-18-17 7.6-17 18-17Z"/>
      <path d="M176 10h16v8.8C196.8 11.6 204 8 213.6 8h3.4v17h-6.3C198.5 25 192 31.7 192 44.8V72h-16V10Z"/>
      <path d="M219 27h16v45h-16z"/>
      <path fill-rule="evenodd" d="M266 8c-18.4 0-31 13.6-31 32.5S247.6 73 266 73c7.1 0 13-2.6 17-7.7V72h15V10h-15v6.1C279 10.7 273.1 8 266 8Zm2 15.5c9.5 0 16 7.1 16 17s-6.5 17-16 17-17-7.1-17-17 7.5-17 17-17Z"/>
      <path fill="#a8d829" d="M226.4 2.3c6.7-1.5 11.2 4.2 9.1 10.1-2.1 6-8.4 9.1-15.5 7.4-1.7-6.8.3-13.9 6.4-17.5Z"/>
    </g>
  `;
}

function layoutSvg() {
  const link = escapeXml("pilcheriagloria.com.ar/products");

  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="1035" cy="65" r="260" fill="#a8d829" opacity=".16"/>
      <circle cx="1035" cy="65" r="165" fill="none" stroke="#a8d829" stroke-width="3" opacity=".35"/>

      <text x="72" y="66" fill="#badd63" font-family="Arial, sans-serif" font-size="20" font-weight="800" letter-spacing="8">PILCHER&#205;A</text>
      ${wordmarkSvg()}

      <rect x="760" y="76" width="250" height="64" rx="32" fill="#a8d829"/>
      <text x="885" y="117" fill="#15210c" font-family="Arial, sans-serif" font-size="25" font-weight="900" text-anchor="middle">STOCK LIMITADO</text>

      <text x="60" y="244" fill="#badd63" font-family="Arial, sans-serif" font-size="27" font-weight="800" letter-spacing="4">UNIFORMES ESCOLARES</text>
      <text x="58" y="344" fill="#ffffff" font-family="Arial, sans-serif" font-size="106" font-weight="900" letter-spacing="-4">&#218;LTIMOS TALLES</text>
      <text x="62" y="402" fill="#c8cfbd" font-family="Arial, sans-serif" font-size="31" font-weight="700">Precios accesibles en prendas seleccionadas</text>

      <rect x="60" y="430" width="460" height="520" rx="30" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3"/>
      <rect x="560" y="430" width="460" height="520" rx="30" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3"/>

      <rect x="74" y="806" width="432" height="128" rx="24" fill="#15170f" fill-opacity=".94"/>
      <text x="100" y="846" fill="#badd63" font-family="Arial, sans-serif" font-size="21" font-weight="800" letter-spacing="1.5">ESCUELA NORMAL</text>
      <text x="100" y="908" fill="#ffffff" font-family="Arial, sans-serif" font-size="55" font-weight="900">$20.000</text>

      <rect x="574" y="806" width="432" height="128" rx="24" fill="#15170f" fill-opacity=".94"/>
      <text x="600" y="846" fill="#badd63" font-family="Arial, sans-serif" font-size="21" font-weight="800" letter-spacing="1.5">ESCUELA DORREGO</text>
      <text x="600" y="908" fill="#ffffff" font-family="Arial, sans-serif" font-size="55" font-weight="900">$25.000</text>

      <rect x="40" y="982" width="1000" height="330" rx="38" fill="#f9fbf3"/>
      <text x="72" y="1032" fill="#487322" font-family="Arial, sans-serif" font-size="22" font-weight="900" letter-spacing="3">VER TALLES Y COMPRAR</text>
      <text x="72" y="1087" fill="#15210c" font-family="Arial, sans-serif" font-size="40" font-weight="900">${link}</text>

      <rect x="72" y="1122" width="680" height="78" rx="20" fill="#a8d829"/>
      <text x="99" y="1172" fill="#15210c" font-family="Arial, sans-serif" font-size="30" font-weight="900">UNIFORMES26</text>
      <text x="350" y="1172" fill="#15210c" font-family="Arial, sans-serif" font-size="28" font-weight="700">&#183; $3.000 DE DESCUENTO</text>
      <text x="72" y="1235" fill="#4d5647" font-family="Arial, sans-serif" font-size="24" font-weight="700">Primeros 10 usos. Se carga desde el enlace promocional.</text>
      <text x="72" y="1277" fill="#4d5647" font-family="Arial, sans-serif" font-size="21">Otras escuelas: consult&#225;. Los precios pueden ser diferentes.</text>

      <rect x="796" y="1014" width="214" height="214" rx="18" fill="#ffffff"/>
      <text x="903" y="1268" fill="#487322" font-family="Arial, sans-serif" font-size="19" font-weight="900" text-anchor="middle" letter-spacing="2">ESCANE&#193; Y COMPR&#193;</text>
    </svg>
  `);
}

async function main() {
  await copyFile(qrSource, qrPath);

  const [normalShirt, dorregoPolo, qr] = await Promise.all([
    preparePhoto("normal-remera.webp"),
    preparePhoto("dorrego-chomba.webp"),
    sharp(qrPath).resize(190, 190, { fit: "contain" }).png().toBuffer(),
  ]);

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: "#15170f",
    },
  })
    .composite([
      { input: normalShirt, left: 60, top: 430 },
      { input: dorregoPolo, left: 560, top: 430 },
      { input: layoutSvg(), left: 0, top: 0 },
      { input: qr, left: 808, top: 1026 },
    ])
    .flatten({ background: "#15170f" })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  console.log(outputPath);
}

await main();
