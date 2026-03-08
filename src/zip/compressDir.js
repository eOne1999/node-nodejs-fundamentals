import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";
import { createBrotliCompress } from "zlib";
import { pipeline } from "stream";
import { promisify } from "util";

const pipelineAsync = promisify(pipeline);

const compressDir = async () => {
  const srcDir = path.resolve("workspace/toCompress");
  const destDir = path.resolve("workspace/compressed");
  const archivePath = path.join(destDir, "archive.br");

  try {
    await fsp.access(srcDir);
  } catch {
    throw new Error("FS operation failed");
  }

  await fsp.mkdir(destDir, { recursive: true });

  const writeToStream = (stream, data) =>
    new Promise((resolve, reject) => {
      const ok = stream.write(data);
      if (ok) return resolve();
      stream.once("drain", resolve);
      stream.once("error", reject);
    });

  const brotli = createBrotliCompress();
  const writeStream = fs.createWriteStream(archivePath);

  const pipelineDone = pipelineAsync(brotli, writeStream);

  const walk = async (dir) => {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(srcDir, fullPath);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const stat = await fsp.stat(fullPath);

        const pathBuf = Buffer.from(relPath, "utf8");
        const header = Buffer.allocUnsafe(4 + pathBuf.length + 8);
        header.writeUInt32BE(pathBuf.length, 0);
        pathBuf.copy(header, 4);
        header.writeBigUInt64BE(BigInt(stat.size), 4 + pathBuf.length);

        await writeToStream(brotli, header);

        await new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(fullPath);
          readStream.on("error", reject);
          readStream.on("end", resolve);
          readStream.pipe(brotli, { end: false });
        });
      }
    }
  };

  await walk(srcDir);
  brotli.end();
  await pipelineDone;
};

await compressDir();
