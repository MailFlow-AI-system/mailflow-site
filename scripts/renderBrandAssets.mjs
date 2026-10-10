import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDirectory = new URL('../public/', import.meta.url)
await mkdir(new URL('brand/', publicDirectory), { recursive: true })

for (const [source, destination, width, height] of [
  ['favicon.svg', 'favicon.png', 64, 64],
  ['favicon.svg', 'apple-touch-icon.png', 180, 180],
  ['favicon.svg', 'brand/logo.png', 512, 512],
  ['social/mailflow-og.svg', 'social/mailflow-og.png', 1200, 630],
]) {
  const output = await sharp(fileURLToPath(new URL(source, publicDirectory)))
    .resize(width, height)
    .png()
    .toFile(fileURLToPath(new URL(destination, publicDirectory)))
  assert.equal(output.width, width)
  assert.equal(output.height, height)
  assert.ok(output.size < 300_000, `${destination} must stay below 300 KB`)
  console.log(`${destination}: ${output.width}x${output.height}, ${output.size} bytes`)
}
