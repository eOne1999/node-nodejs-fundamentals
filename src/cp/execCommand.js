import { spawn } from "child_process";

const execCommand = () => {
  const [, , command] = process.argv;

  const child = spawn(command, {
    env: process.env,
    stdio: ["inherit", "inherit", "inherit"],
    shell: true,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
};

execCommand();
