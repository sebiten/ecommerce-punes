import { join } from "node:path";
import sharp from "sharp";

const WIDTH = 1640;
const HEIGHT = 624;

const root = process.cwd();
const pngPath = join(root, "public", "pilcheria-gloria-facebook-portada.png");
const jpegPath = join(root, "public", "pilcheria-gloria-facebook-portada.jpg");

function wordmarkSvg() {
  return `
    <g transform="translate(320 77) scale(1.04)" fill="#f9fbf3">
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

function overlaySvg() {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <path d="M230 594H980" stroke="#a8d829" stroke-width="2" opacity=".2"/>

      <text x="322" y="61" fill="#badd63" font-family="Arial, sans-serif" font-size="20" font-weight="800" letter-spacing="8">PILCHER&#205;A</text>
      ${wordmarkSvg()}

      <rect x="320" y="204" width="62" height="6" rx="3" fill="#a8d829"/>
      <text x="320" y="263" fill="#badd63" font-family="Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="4">UNIFORMES ESCOLARES EN LEDESMA</text>
      <text x="316" y="347" fill="#ffffff" font-family="Arial, sans-serif" font-size="68" font-weight="900" letter-spacing="-2.5">Stock real por talle.</text>
      <text x="320" y="399" fill="#c8cfbd" font-family="Arial, sans-serif" font-size="30" font-weight="700">Encontr&#225; tu escuela y compr&#225; online.</text>

      <rect x="320" y="447" width="230" height="52" rx="26" fill="#a8d829"/>
      <text x="435" y="481" fill="#15210c" font-family="Arial, sans-serif" font-size="21" font-weight="900" text-anchor="middle" letter-spacing="1">VER CAT&#193;LOGO</text>
      <text x="578" y="481" fill="#ffffff" font-family="Arial, sans-serif" font-size="27" font-weight="900">pilcheriagloria.com.ar</text>

      <text x="320" y="548" fill="#c8cfbd" font-family="Arial, sans-serif" font-size="22" font-weight="700">Compra segura &#183; Retiro en Av. Los Ceibos 429</text>
      <text x="320" y="580" fill="#8f9a87" font-family="Arial, sans-serif" font-size="19">Consultanos por m&#225;s escuelas y talles disponibles en el local.</text>
    </svg>
  `);
}

async function main() {
  const png = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: "#15170f",
    },
  })
    .composite([{ input: overlaySvg(), left: 0, top: 0 }])
    .flatten({ background: "#15170f" })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await sharp(png).toFile(pngPath);
  await sharp(png)
    .jpeg({ quality: 96, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(jpegPath);

  console.log(`${pngPath}\n${jpegPath}`);
}

await main();
