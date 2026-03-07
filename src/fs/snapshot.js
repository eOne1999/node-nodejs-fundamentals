import fs from 'fs/promises';
import path from 'path';

const snapshot = async () => {
  try {
    const workspacePath = path.resolve('workspace');
    const snapshotPath = path.resolve('snapshot.json');

    const entries = [];
    const snapshotContent = {
      "rootPath": workspacePath,
      "entries": entries
    }

    try {
      await fs.access(workspacePath);
    }
    catch (err) {
      throw new Error('FS operation failed');
    }

    const scanDirectory = async (dir) => {
      const files = await fs.readdir(dir, ({ withFileTypes: true }));

      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        const relativePath = path.relative(workspacePath, fullPath)

        if (file.isDirectory()) {
          entries.push({ "path": relativePath, "type": "directory" });
          await scanDirectory(fullPath)
        }

        if (file.isFile()) {
          const fileStat = await fs.stat(fullPath);
          const fileContent = await fs.readFile(fullPath);
          entries.push({ "path": relativePath, "type": "file", "size": fileStat.size, "content": Buffer.from(fileContent).toString('base64') })
        }
      }
    }

    await scanDirectory(workspacePath);
    await fs.writeFile(snapshotPath, JSON.stringify(snapshotContent, null, 2))

  } catch (err) {
    throw err;
  }
};

await snapshot();
