import { Transform } from 'stream';

const lineNumberer = () => {
  process.stdin.setEncoding('utf8');

  let lineNumber = 1;
  let remaining = '';

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      remaining += chunk;
      const lines = remaining.split('\n');
      remaining = lines.pop();

      for (const line of lines) {
        this.push(`${lineNumber++} | ${line}\n`);
      }

      callback();
    },

    flush(callback) {
      if (remaining !== '') {
        this.push(`${lineNumber} | ${remaining}`);
      }
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

lineNumberer();
