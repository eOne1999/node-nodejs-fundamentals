import fs from 'fs';
import readline from 'readline';

const split = async () => {
  const args = process.argv.slice(2);
  let linesPerChunk = 10;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lines' && i + 1 < args.length) {
      const val = parseInt(args[i + 1], 10);
      if (!isNaN(val) && val > 0) {
        linesPerChunk = val;
      }
      break;
    }
  }

  const sourceFile = 'source.txt';
  const readStream = fs.createReadStream(sourceFile);

  readStream.on('error', (err) => {
    console.error(`Error reading source.txt: ${err.message}`);
    process.exit(1);
  });

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  let chunkNumber = 1;
  let linesBuffer = [];
  const writePromises = [];

  const flushBuffer = () => {
    if (linesBuffer.length === 0) return;

    const filename = `chunk_${chunkNumber}.txt`;
    const ws = fs.createWriteStream(filename);

    const promise = new Promise((resolve, reject) => {
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
    writePromises.push(promise);

    for (const line of linesBuffer) {
      ws.write(line + '\n');
    }
    ws.end();

    chunkNumber++;
    linesBuffer = [];
  };

  rl.on('line', (line) => {
    linesBuffer.push(line);
    if (linesBuffer.length === linesPerChunk) {
      flushBuffer();
    }
  });

  await new Promise((resolve, reject) => {
    rl.on('close', resolve);
    rl.on('error', reject);
  });

  if (linesBuffer.length > 0) {
    flushBuffer();
  }

  await Promise.all(writePromises);
};

await split();
