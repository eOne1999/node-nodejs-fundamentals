import readline from 'readline';

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();
  rl.on('line', (line) => {
    const command = line.trim();

    switch (command) {
      case 'uptime':
        console.log(`Uptime: ${process.uptime().toFixed(2)}s`);
        break;
      case 'cwd':
        console.log(process.cwd());
        break;
      case 'date':
        console.log(new Date().toISOString());
        break;
      case 'exit':
        console.log('Goodbye!');
        rl.close();
        return;
      default:
        if (command) {
          console.log('Unknown command');
        }
    }

    rl.prompt();
  });

  rl.on('SIGINT', () => {
    console.log('\nGoodbye!');
    rl.close();
  });
};

interactive();
