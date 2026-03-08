import fs from 'fs/promises';
import path from 'path';

const findByExt = async () => {
  const workspacePath = path.resolve('workspace');
  const results = [];

  try {
    const args = process.argv.slice(2);
    let ext = '.txt';
    const lastExtIndex = args.lastIndexOf('--ext');
    if (lastExtIndex !== -1 && args[lastExtIndex + 1]) {
      ext = args[lastExtIndex + 1];
      if (!ext.startsWith('.')) ext = '.' + ext;
      ext = ext.toLowerCase();
    }

    try {
      await fs.access(workspacePath);
    } catch {
      throw new Error('FS operation failed');
    }

    const scan = async (dir, relativeDir = '') => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(relativeDir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath, relativePath);
        } else if (entry.isFile()) {
          if (path.extname(entry.name).toLowerCase() === ext.toLowerCase()) {
            results.push(relativePath);
          }
        }
      }
    }

    await scan(workspacePath);
    results.sort().forEach(p => console.log(p));

  } catch {
    throw new Error('FS operation failed');
  }
};

await findByExt();
