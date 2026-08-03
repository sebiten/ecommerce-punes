import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const WIDTH = 1080;
const HEIGHT = 1350;
const root = process.cwd();
const catalogDirectory = join(root, "public", "images", "uniforms", "catalog");
const outputDirectory = join(root, "public", "social", "facebook-feed");

interface PhotoPlacement {
  filename: string;
  left: number;
  top: number;
  width: number;
  height: number;
  radius?: number;
}

function wordmarkSvg(x: number, y: number, scale = 0.86) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})" fill="#f9fbf3">
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

function backgroundSvg(content: string, background = "#15170f") {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="${background}" fill-opacity="0"/>
      <circle cx="1030" cy="70" r="270" fill="#a8d829" opacity=".13"/>
      <circle cx="1030" cy="70" r="175" fill="none" stroke="#a8d829" stroke-width="3" opacity=".28"/>
      ${content}
    </svg>
  `);
}

async function preparePhoto({
  filename,
  width,
  height,
  radius = 28,
}: PhotoPlacement) {
  const mask = Buffer.from(`
    <svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/>
    </svg>
  `);

  return sharp(join(catalogDirectory, filename))
    .resize(width, height, {
      fit: "contain",
      position: "centre",
      background: "#24252a",
    })
    .modulate({ brightness: 1.03, saturation: 1.02 })
    .sharpen({ sigma: 0.55 })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function renderPost(
  filename: string,
  svg: Buffer,
  photos: PhotoPlacement[] = []
) {
  const preparedPhotos = await Promise.all(
    photos.map(async (photo) => ({
      input: await preparePhoto(photo),
      left: photo.left,
      top: photo.top,
    }))
  );

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: "#15170f",
    },
  })
    .composite([...preparedPhotos, { input: svg, left: 0, top: 0 }])
    .flatten({ background: "#15170f" })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(join(outputDirectory, filename));
}

function presentationPost() {
  const cards = [
    { x: 54, label: "ESCUELA NORMAL" },
    { x: 378, label: "COLEGIO FASTA" },
    { x: 702, label: "BACHILLERATO N° 7" },
  ];

  return backgroundSvg(`
    <text x="62" y="62" fill="#badd63" font-family="Arial, sans-serif" font-size="19" font-weight="800" letter-spacing="7">PILCHER&#205;A</text>
    ${wordmarkSvg(60, 78)}
    <rect x="710" y="72" width="300" height="62" rx="31" fill="#a8d829"/>
    <text x="860" y="112" fill="#15210c" font-family="Arial, sans-serif" font-size="22" font-weight="900" text-anchor="middle">LEDESMA · JUJUY</text>

    <text x="58" y="250" fill="#badd63" font-family="Arial, sans-serif" font-size="26" font-weight="900" letter-spacing="4">UNIFORMES ESCOLARES</text>
    <text x="55" y="338" fill="#ffffff" font-family="Arial, sans-serif" font-size="80" font-weight="900" letter-spacing="-3">Varias escuelas.</text>
    <text x="58" y="398" fill="#c8cfbd" font-family="Arial, sans-serif" font-size="34" font-weight="700">Stock real por talle y compra online.</text>

    ${cards
      .map(
        ({ x, label }) => `
          <rect x="${x}" y="444" width="306" height="605" rx="28" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="3"/>
          <rect x="${x + 12}" y="940" width="282" height="94" rx="20" fill="#15170f" fill-opacity=".93"/>
          <text x="${x + 153}" y="996" fill="#d8f47f" font-family="Arial, sans-serif" font-size="18" font-weight="900" text-anchor="middle" letter-spacing="1">${label}</text>
        `
      )
      .join("")}

    <rect x="40" y="1088" width="1000" height="220" rx="34" fill="#f8faf3"/>
    <text x="72" y="1147" fill="#487322" font-family="Arial, sans-serif" font-size="22" font-weight="900" letter-spacing="2.5">TAMBI&#201;N TENEMOS M&#193;S OPCIONES EN EL NEGOCIO</text>
    <text x="72" y="1213" fill="#15210c" font-family="Arial, sans-serif" font-size="37" font-weight="900">pilcheriagloria.com.ar/products</text>
    <text x="72" y="1264" fill="#4d5647" font-family="Arial, sans-serif" font-size="24">Compr&#225; online o consultanos por tu escuela y talle.</text>
  `);
}

function schoolsPost() {
  const cards = [
    { x: 48, y: 310, label: "NORMAL" },
    { x: 374, y: 310, label: "FASTA" },
    { x: 700, y: 310, label: "ETHA" },
    { x: 48, y: 737, label: "BACHILLERATO N° 7" },
    { x: 374, y: 737, label: "COMERCIO N° 6" },
    { x: 700, y: 737, label: "LOLA MORA" },
  ];

  return backgroundSvg(`
    ${wordmarkSvg(60, 28, 0.48)}
    <text x="56" y="154" fill="#ffffff" font-family="Arial, sans-serif" font-size="82" font-weight="900" letter-spacing="-3">No es una sola escuela.</text>
    <text x="60" y="218" fill="#badd63" font-family="Arial, sans-serif" font-size="36" font-weight="800">Estas son algunas de las disponibles.</text>

    ${cards
      .map(
        ({ x, y, label }) => `
          <rect x="${x}" y="${y}" width="306" height="392" rx="26" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="3"/>
          <rect x="${x + 10}" y="${y + 314}" width="286" height="66" rx="18" fill="#15170f" fill-opacity=".94"/>
          <text x="${x + 153}" y="${y + 355}" fill="#d8f47f" font-family="Arial, sans-serif" font-size="18" font-weight="900" text-anchor="middle" letter-spacing=".8">${label}</text>
        `
      )
      .join("")}

    <rect x="40" y="1175" width="1000" height="132" rx="30" fill="#a8d829"/>
    <text x="540" y="1233" fill="#15210c" font-family="Arial, sans-serif" font-size="31" font-weight="900" text-anchor="middle">&#191;No aparece la tuya? Consultanos.</text>
    <text x="540" y="1272" fill="#27361c" font-family="Arial, sans-serif" font-size="23" font-weight="700" text-anchor="middle">En el negocio tenemos m&#225;s escuelas y talles.</text>
  `);
}

function howToBuyPost() {
  const steps = [
    {
      x: 54,
      y: 338,
      number: "1",
      title: "Buscá tu escuela",
      description: ["Usá el buscador o revisá", "el catálogo."],
    },
    {
      x: 552,
      y: 338,
      number: "2",
      title: "Elegí el talle",
      description: ["Confirmá talle y cantidad", "antes de agregar."],
    },
    {
      x: 54,
      y: 690,
      number: "3",
      title: "Pagá online",
      description: ["Mercado Pago procesa", "el pago de forma segura."],
    },
    {
      x: 552,
      y: 690,
      number: "4",
      title: "Esperá el aviso",
      description: ["Te avisamos por WhatsApp", "cuándo podés retirar."],
    },
  ];

  return backgroundSvg(`
    ${wordmarkSvg(60, 34, 0.54)}
    <text x="56" y="160" fill="#ffffff" font-family="Arial, sans-serif" font-size="91" font-weight="900" letter-spacing="-4">Comprar es simple.</text>
    <text x="60" y="228" fill="#c8cfbd" font-family="Arial, sans-serif" font-size="32" font-weight="700">Pod&#233;s hacerlo desde el celular y sin registrarte.</text>

    ${steps
      .map(
        ({ x, y, number, title, description }) => `
          <rect x="${x}" y="${y}" width="474" height="318" rx="30" fill="#f8faf3"/>
          <circle cx="${x + 62}" cy="${y + 64}" r="35" fill="#a8d829"/>
          <text x="${x + 62}" y="${y + 77}" fill="#15210c" font-family="Arial, sans-serif" font-size="34" font-weight="900" text-anchor="middle">${number}</text>
          <text x="${x + 34}" y="${y + 155}" fill="#15210c" font-family="Arial, sans-serif" font-size="32" font-weight="900">${title}</text>
          <text fill="#4d5647" font-family="Arial, sans-serif" font-size="23">
            <tspan x="${x + 34}" y="${y + 210}">${description[0]}</tspan>
            <tspan x="${x + 34}" y="${y + 244}">${description[1]}</tspan>
          </text>
        `
      )
      .join("")}

    <rect x="54" y="1060" width="972" height="222" rx="34" fill="#a8d829"/>
    <text x="540" y="1133" fill="#15210c" font-family="Arial, sans-serif" font-size="25" font-weight="800" text-anchor="middle" letter-spacing="2">TU PEDIDO QUEDA PROTEGIDO CON UN C&#211;DIGO &#218;NICO</text>
    <text x="540" y="1192" fill="#15210c" font-family="Arial, sans-serif" font-size="38" font-weight="900" text-anchor="middle">pilcheriagloria.com.ar/products</text>
    <text x="540" y="1241" fill="#344720" font-family="Arial, sans-serif" font-size="23" font-weight="700" text-anchor="middle">Us&#225; un email y un WhatsApp reales para recibir novedades.</text>
  `);
}

function pickupPost() {
  return backgroundSvg(`
    ${wordmarkSvg(60, 34, 0.54)}
    <text x="56" y="160" fill="#ffffff" font-family="Arial, sans-serif" font-size="89" font-weight="900" letter-spacing="-4">Retiro coordinado.</text>
    <text x="60" y="228" fill="#c8cfbd" font-family="Arial, sans-serif" font-size="31" font-weight="700">Te avisamos por WhatsApp cuando el pedido est&#233; listo.</text>

    <circle cx="540" cy="445" r="130" fill="#a8d829"/>
    <path d="M540 345c-57 0-103 43-103 98 0 72 103 166 103 166s103-94 103-166c0-55-46-98-103-98Zm0 139c-26 0-47-20-47-45s21-45 47-45 47 20 47 45-21 45-47 45Z" fill="#15210c"/>

    <rect x="72" y="622" width="936" height="430" rx="38" fill="#f8faf3"/>
    <text x="540" y="704" fill="#487322" font-family="Arial, sans-serif" font-size="22" font-weight="900" text-anchor="middle" letter-spacing="2">PUNTO DE RETIRO</text>
    <text x="540" y="785" fill="#15210c" font-family="Arial, sans-serif" font-size="51" font-weight="900" text-anchor="middle">Av. Los Ceibos 429</text>
    <text x="540" y="836" fill="#4d5647" font-family="Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle">Libertador General San Mart&#237;n, Jujuy</text>
    <line x1="178" y1="884" x2="902" y2="884" stroke="#d7decf" stroke-width="2"/>
    <text x="540" y="942" fill="#15210c" font-family="Arial, sans-serif" font-size="26" font-weight="900" text-anchor="middle">Referencia</text>
    <text x="540" y="988" fill="#4d5647" font-family="Arial, sans-serif" font-size="25" text-anchor="middle">Casa amarilla de dos pisos, familia Burgos.</text>

    <rect x="72" y="1090" width="936" height="194" rx="32" fill="#a8d829"/>
    <text x="540" y="1160" fill="#15210c" font-family="Arial, sans-serif" font-size="29" font-weight="900" text-anchor="middle">Esper&#225; nuestra confirmaci&#243;n antes de acercarte.</text>
    <text x="540" y="1213" fill="#344720" font-family="Arial, sans-serif" font-size="25" font-weight="700" text-anchor="middle">Encontr&#225; el enlace de Google Maps en la tienda.</text>
  `);
}

function promotionPost() {
  const cards = [
    { x: 40, label: "NORMAL" },
    { x: 295, label: "FASTA" },
    { x: 550, label: "BACH. N° 7" },
    { x: 805, label: "DORREGO" },
  ];

  return backgroundSvg(`
    ${wordmarkSvg(60, 34, 0.54)}
    <rect x="770" y="62" width="250" height="60" rx="30" fill="#a8d829"/>
    <text x="895" y="101" fill="#15210c" font-family="Arial, sans-serif" font-size="21" font-weight="900" text-anchor="middle">STOCK LIMITADO</text>

    <text x="56" y="214" fill="#badd63" font-family="Arial, sans-serif" font-size="28" font-weight="900" letter-spacing="4">UNIFORMES DE VARIAS ESCUELAS</text>
    <text x="54" y="320" fill="#ffffff" font-family="Arial, sans-serif" font-size="101" font-weight="900" letter-spacing="-4">&#218;ltimos talles</text>
    <text x="58" y="382" fill="#c8cfbd" font-family="Arial, sans-serif" font-size="34" font-weight="700">Prendas seleccionadas a $20.000 y $25.000</text>

    ${cards
      .map(
        ({ x, label }) => `
          <rect x="${x}" y="430" width="235" height="406" rx="24" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="3"/>
          <rect x="${x + 9}" y="764" width="217" height="60" rx="16" fill="#15170f" fill-opacity=".94"/>
          <text x="${x + 117.5}" y="802" fill="#d8f47f" font-family="Arial, sans-serif" font-size="16" font-weight="900" text-anchor="middle" letter-spacing=".7">${label}</text>
        `
      )
      .join("")}

    <rect x="40" y="884" width="1000" height="424" rx="38" fill="#f8faf3"/>
    <text x="72" y="949" fill="#487322" font-family="Arial, sans-serif" font-size="22" font-weight="900" letter-spacing="2.5">PRIMERAS 10 COMPRAS ONLINE</text>
    <text x="72" y="1032" fill="#15210c" font-family="Arial, sans-serif" font-size="62" font-weight="900">$3.000 de descuento</text>
    <rect x="72" y="1072" width="390" height="82" rx="21" fill="#a8d829"/>
    <text x="267" y="1125" fill="#15210c" font-family="Arial, sans-serif" font-size="34" font-weight="900" text-anchor="middle" letter-spacing="3">UNIFORMES26</text>
    <text x="72" y="1209" fill="#15210c" font-family="Arial, sans-serif" font-size="37" font-weight="900">pilcheriagloria.com.ar/products</text>
    <text x="72" y="1261" fill="#4d5647" font-family="Arial, sans-serif" font-size="23" font-weight="700">Si busc&#225;s otra escuela, consultanos. Los precios pueden variar.</text>
  `);
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });

  await Promise.all([
    renderPost("01-presentacion.png", presentationPost(), [
      { filename: "normal-remera.webp", left: 54, top: 444, width: 306, height: 605 },
      { filename: "fasta-chomba.webp", left: 378, top: 444, width: 306, height: 605 },
      {
        filename: "bachillerato-calilegua-chomba.webp",
        left: 702,
        top: 444,
        width: 306,
        height: 605,
      },
    ]),
    renderPost("02-varias-escuelas.png", schoolsPost(), [
      { filename: "normal-remera.webp", left: 48, top: 310, width: 306, height: 392 },
      { filename: "fasta-chomba.webp", left: 374, top: 310, width: 306, height: 392 },
      { filename: "etha-remera.webp", left: 700, top: 310, width: 306, height: 392 },
      {
        filename: "bachillerato-calilegua-chomba.webp",
        left: 48,
        top: 737,
        width: 306,
        height: 392,
      },
      { filename: "comercial-6-chomba.webp", left: 374, top: 737, width: 306, height: 392 },
      {
        filename: "lola-mora-escuela-de-artes-remera.webp",
        left: 700,
        top: 737,
        width: 306,
        height: 392,
      },
    ]),
    renderPost("03-como-comprar.png", howToBuyPost()),
    renderPost("04-retiro-coordinado.png", pickupPost()),
    renderPost("05-promocion.png", promotionPost(), [
      { filename: "normal-remera.webp", left: 40, top: 430, width: 235, height: 406, radius: 24 },
      { filename: "fasta-chomba.webp", left: 295, top: 430, width: 235, height: 406, radius: 24 },
      {
        filename: "bachillerato-calilegua-remera.webp",
        left: 550,
        top: 430,
        width: 235,
        height: 406,
        radius: 24,
      },
      { filename: "dorrego-chomba.webp", left: 805, top: 430, width: 235, height: 406, radius: 24 },
    ]),
  ]);

  console.log(outputDirectory);
}

await main();
