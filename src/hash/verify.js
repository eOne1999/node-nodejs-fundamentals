import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { pipeline } from 'stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const verify = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let expectedHashes;
  try {
    const checksumsPath = path.join(__dirname, 'checksums.json');
    const data = await readFile(checksumsPath, 'utf8');
    expectedHashes = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('FS operation failed');
    }
    throw err;
  }

  for (const [filename, expectedHash] of Object.entries(expectedHashes)) {
    let actualHash;
    try {
      const hash = createHash('sha256');
      const filePath = path.join(__dirname, filename);
      const readStream = createReadStream(filePath);

      await pipeline(readStream, async function* (source) {
        for await (const chunk of source) {
          hash.update(chunk);
        }
      });

      actualHash = hash.digest('hex');
    } catch {
      console.log(`${filename} — FAIL`);
      continue;
    }

    const result = actualHash === expectedHash ? 'OK' : 'FAIL';
    console.log(`${filename} — ${result}`);
  }
};

await verify();
