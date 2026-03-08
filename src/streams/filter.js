import { Transform } from 'stream';

const filter = () => {
  const args = process.argv.slice(2);
  let pattern = null;
  let remaining = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pattern' && i + 1 < args.length) {
      pattern = args[i + 1];
      break;
    }
  }

  if (pattern === null) {
    console.error('Error: --pattern argument is required');
    process.exit(1);
  }

  process.stdin.setEncoding('utf8');

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      remaining += chunk;
      const lines = remaining.split('\n');
      remaining = lines.pop();

      for (const line of lines) {
        if (line.includes(pattern)) {
          this.push(line + '\n');
        }
      }
      callback();
    },

    flush(callback) {
      if (remaining !== '' && remaining.includes(pattern)) {
        this.push(remaining);
      }
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

filter();
