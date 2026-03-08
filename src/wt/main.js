import { Worker } from "worker_threads";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MinHeap {
  constructor() { this._heap = []; }

  push(item) {
    this._heap.push(item);
    this._bubbleUp(this._heap.length - 1);
  }

  pop() {
    const top = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() { return this._heap.length; }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._heap[parent].val <= this._heap[i].val) break;
      [this._heap[parent], this._heap[i]] = [this._heap[i], this._heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this._heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this._heap[l].val < this._heap[smallest].val) smallest = l;
      if (r < n && this._heap[r].val < this._heap[smallest].val) smallest = r;
      if (smallest === i) break;
      [this._heap[smallest], this._heap[i]] = [this._heap[i], this._heap[smallest]];
      i = smallest;
    }
  }
}

const mergeKWay = (arrays) => {
  const heap = new MinHeap();
  const indices = new Array(arrays.length).fill(0);

  for (let i = 0; i < arrays.length; i++) {
    if (arrays[i].length > 0) {
      heap.push({ val: arrays[i][0], chunkIdx: i });
      indices[i] = 1;
    }
  }

  const result = [];
  while (heap.size > 0) {
    const { val, chunkIdx } = heap.pop();
    result.push(val);
    const next = indices[chunkIdx];
    if (next < arrays[chunkIdx].length) {
      heap.push({ val: arrays[chunkIdx][next], chunkIdx });
      indices[chunkIdx]++;
    }
  }
  return result;
};

const main = async () => {
  const dataPath = path.join(__dirname, "data.json");
  const file = await fs.readFile(dataPath, "utf-8");
  const numbers = JSON.parse(file);

  const cpuCount = os.cpus().length;
  const chunkSize = Math.ceil(numbers.length / cpuCount);

  const chunks = Array.from({ length: cpuCount }, (_, i) =>
    numbers.slice(i * chunkSize, (i + 1) * chunkSize)
  ).filter((c) => c.length > 0);

  const workerURL = new URL("./worker.js", import.meta.url);

  const sortedChunks = await Promise.all(
    chunks.map((chunk) =>
      new Promise((resolve, reject) => {
        const worker = new Worker(workerURL);

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
        });

        worker.postMessage(chunk);
      })
    )
  );

  const finalSorted = mergeKWay(sortedChunks);
  console.log(finalSorted);
};

await main();
