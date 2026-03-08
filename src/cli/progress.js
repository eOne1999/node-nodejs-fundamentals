const progress = () => {
  const args = process.argv.slice(2);
  const options = {
    duration: 5000,
    interval: 100,
    length: 30,
    color: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--duration':
        options.duration = parseInt(args[++i], 10) || options.duration;
        break;
      case '--interval':
        options.interval = parseInt(args[++i], 10) || options.interval;
        break;
      case '--length':
        options.length = parseInt(args[++i], 10) || options.length;
        break;
      case '--color':
        options.color = args[++i];
        break;
    }
  }

  const isValidColor = (color) => /^#[0-9A-Fa-f]{6}$/.test(color);
  const useColor = options.color && isValidColor(options.color);

  const getColorSequence = (hex) => {
    if (!useColor) return '';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  };

  const colorSeq = useColor ? getColorSequence(options.color) : '';
  const resetSeq = '\x1b[0m';

  const totalDuration = options.duration;
  const intervalTime = options.interval;
  const barLength = options.length;

  let elapsed = 0;
  const startTime = Date.now();

  const updateProgress = () => {
    const now = Date.now();
    elapsed = now - startTime;
    const percent = Math.min(100, (elapsed / totalDuration) * 100);
    const filled = Math.floor((percent / 100) * barLength);
    const empty = barLength - filled;

    const filledPart = '█'.repeat(filled);
    const emptyPart = ' '.repeat(empty);
    const bar = `[${colorSeq}${filledPart}${resetSeq}${emptyPart}] ${Math.round(percent)}%`;

    process.stdout.write(`\r${bar}`);
  };

  const intervalId = setInterval(updateProgress, intervalTime);

  setTimeout(() => {
    clearInterval(intervalId);
    const filled = barLength;
    const bar = `[${colorSeq}${'█'.repeat(filled)}${resetSeq}] 100%`;
    process.stdout.write(`\r${bar}\nDone!\n`);
  }, totalDuration);
};

progress();
