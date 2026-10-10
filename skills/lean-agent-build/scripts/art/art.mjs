// Make one image with the official OpenAI library.
// Usage: node scripts/art/art.mjs <out.png> "<prompt>" [size] [quality] [transparent]
//   size: 1024x1024 | 1024x1536 | 1536x1024   (default 1024x1024)
//   quality: low | medium | high              (default medium)
//   transparent: pass the word "transparent" for a clear background
// The key comes from the OPENAI_API_KEY environment variable. It is never printed.
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

const [out, prompt, size = "1024x1024", quality = "medium", bg] = process.argv.slice(2);
if (!out || !prompt) {
  console.error('Usage: node scripts/art/art.mjs <out.png> "<prompt>" [size] [quality] [transparent]');
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}
const model = process.env.ART_MODEL || "gpt-image-1.5";
const client = new OpenAI();
const res = await client.images.generate({
  model,
  prompt,
  size,
  quality,
  n: 1,
  ...(bg === "transparent" ? { background: "transparent", output_format: "png" } : {}),
});
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(res.data[0].b64_json, "base64"));
fs.appendFileSync(
  "docs/art-log.md",
  `- ${new Date().toISOString().slice(0, 10)} | ${model} | ${size} ${quality} | ${out} | ${prompt}\n`
);
console.log(`saved ${out} (${model}, ${size}, ${quality})`);
