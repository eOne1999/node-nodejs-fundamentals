import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";
import { createBrotliDecompress } from "zlib";

const decompressDir = async () => {
  const srcDir = path.resolve("workspace/compressed");
  const archivePath = path.join(srcDir, "archive.br");
  const destDir = path.resolve("workspace/decompressed");

  try {
    await fsp.access(srcDir);
    await fsp.access(archivePath);
  } catch {
    throw new Error("FS operation failed");
  }

  await fsp.mkdir(destDir, { recursive: true });

  const readStream = fs.createReadStream(archivePath);
  const decompress = createBrotliDecompress();
  readStream.on("error", (err) => decompress.destroy(err));
  readStream.pipe(decompress);

  const writeToFile = (stream, chunk) =>
    new Promise((resolve, reject) => {
      const ok = stream.write(chunk);
      if (ok) return resolve();
      stream.once("drain", resolve);
      stream.once("error", reject);
    });

  const closeFile = (stream) =>
    new Promise((resolve, reject) => {
      stream.end();
      stream.once("finish", resolve);
      stream.once("error", reject);
    });

  let buf = Buffer.alloc(0);
  let state = "PATH_LEN";
  let pathLength = 0;
  let relPath = "";
  let bytesRemaining = 0n;
  let fileStream = null;

  const processChunk = async (chunk) => {
    buf = Buffer.concat([buf, chunk]);

    while (true) {
      if (state === "PATH_LEN") {
        if (buf.length < 4) break;
        pathLength = buf.readUInt32BE(0);
        buf = buf.subarray(4);
        state = "PATH";

      } else if (state === "PATH") {
        if (buf.length < pathLength) break;
        relPath = buf.subarray(0, pathLength).toString("utf8");
        buf = buf.subarray(pathLength);
        state = "FILE_SIZE";

      } else if (state === "FILE_SIZE") {
        if (buf.length < 8) break;
        bytesRemaining = buf.readBigUInt64BE(0);
        buf = buf.subarray(8);

        const fullPath = path.join(destDir, relPath);
        await fsp.mkdir(path.dirname(fullPath), { recursive: true });
        fileStream = fs.createWriteStream(fullPath);

        if (bytesRemaining === 0n) {
          await closeFile(fileStream);
          fileStream = null;
          state = "PATH_LEN";
        } else {
          state = "FILE_DATA";
        }

      } else if (state === "FILE_DATA") {
        if (buf.length === 0) break;

        const take = bytesRemaining > BigInt(buf.length)
          ? buf.length
          : Number(bytesRemaining);
        const slice = buf.subarray(0, take);
        buf = buf.subarray(take);
        bytesRemaining -= BigInt(take);

        await writeToFile(fileStream, slice);

        if (bytesRemaining === 0n) {
          await closeFile(fileStream);
          fileStream = null;
          state = "PATH_LEN";
        }
      }
    }
  };

  for await (const chunk of decompress) {
    await processChunk(chunk);
  }
};

await decompressDir();
