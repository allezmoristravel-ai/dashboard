import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "public/allez-moris-logo.png");
const OUT = path.join(ROOT, "public/icons");

const BG = "#fefbf9"; // manifest background_color, light theme

async function main() {
  for (const size of [192, 512]) {
    await sharp(SRC)
      .resize(size, size, { kernel: sharp.kernel.lanczos3 })
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));
  }

  const maskableLogoSize = Math.round(512 * 0.8);
  const maskableLogo = await sharp(SRC)
    .resize(maskableLogoSize, maskableLogoSize, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: BG },
  })
    .composite([{ input: maskableLogo, gravity: "center" }])
    .png()
    .toFile(path.join(OUT, "maskable-512.png"));

  const appleLogo = await sharp(SRC)
    .resize(150, 150, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  await sharp({
    create: { width: 180, height: 180, channels: 4, background: BG },
  })
    .composite([{ input: appleLogo, gravity: "center" }])
    .flatten({ background: BG })
    .png()
    .toFile(path.join(ROOT, "public/apple-touch-icon.png"));

  console.log("Icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
