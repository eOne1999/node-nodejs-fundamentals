import fs from 'fs/promises';
import path from 'path';

const merge = async () => {
  const workspacePath = path.resolve('workspace');
  const partsPath = path.join(workspacePath, 'parts');
  const mergedPath = path.join(workspacePath, 'merged.txt');

  try {
    try {
      await fs.access(partsPath);
    } catch {
      throw new Error('FS operation failed');
    }

    const args = process.argv.slice(2);
    let filesToMerge = [];

    const filesIndex = args.indexOf('--files');
    if (filesIndex !== -1) {
      if (filesIndex + 1 >= args.length) {
        throw new Error('FS operation failed');
      }
      const fileListStr = args[filesIndex + 1];
      filesToMerge = fileListStr.split(',').map(name => name.trim());

      if (filesToMerge.length === 0) {
        throw new Error('FS operation failed');
      }

      for (const fileName of filesToMerge) {
        const filePath = path.join(partsPath, fileName);
        try {
          await fs.access(filePath);
        } catch {
          throw new Error('FS operation failed');
        }
      }
    } else {
      const allItems = await fs.readdir(partsPath, { withFileTypes: true });
      const txtFiles = allItems
        .filter(item => item.isFile() && path.extname(item.name).toLowerCase() === '.txt')
        .map(item => item.name)
        .sort((a, b) => a.localeCompare(b));

      if (txtFiles.length === 0) {
        throw new Error('FS operation failed');
      }
      filesToMerge = txtFiles;
    }

    let mergedContent = '';
    for (const fileName of filesToMerge) {
      const filePath = path.join(partsPath, fileName);
      const content = await fs.readFile(filePath, 'utf8');
      mergedContent += content;
    }

    await fs.writeFile(mergedPath, mergedContent, 'utf8');

  } catch {
    throw new Error('FS operation failed')
  }
};

await merge();
