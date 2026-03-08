import fs from 'fs/promises';
import path from 'path';

const restore = async () => {
  const snapshotPath = path.resolve('snapshot.json');
  const workspaceRestPath = path.resolve('workspace_restored');
  let snapshot;

  try {
    try {
      await fs.access(snapshotPath);
    } catch {
      throw new Error('FS operation failed');
    }

    try {
      const snapshotData = await fs.readFile(snapshotPath, 'utf8');
      snapshot = JSON.parse(snapshotData);
    } catch {
      throw new Error('FS operation failed');
    }

    try {
      await fs.access(workspaceRestPath);
      throw new Error('FS operation failed');

    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.mkdir(workspaceRestPath);
      } else throw new Error('FS operation failed');
    }

    for (const entry of snapshot.entries) {
      const entryPath = path.resolve(workspaceRestPath, entry.path);
      const relativePath = path.relative(workspaceRestPath, entryPath);

      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('FS operation failed');
      }

      if (entry.type === 'directory') {
        await fs.mkdir(entryPath, { recursive: true })

      } else if (entry.type === 'file') {
        const fileContent = Buffer.from(entry.content, 'base64');
        await fs.mkdir(path.dirname(entryPath), { recursive: true });
        await fs.writeFile(entryPath, fileContent)

      } else throw new Error('FS operation failed');
    }

  } catch (err) {
    throw err;
  }
};

await restore();
