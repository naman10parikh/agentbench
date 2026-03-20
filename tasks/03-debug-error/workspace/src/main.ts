import { parseConfig } from "./parser.js";

function main(): void {
  // Simulates reading from a config file where some fields may be missing
  const rawConfig = {
    env: "production",
    port: "8080",
    // name is missing — this causes the crash
  };

  const config = parseConfig(rawConfig);
  console.log(
    `Server: ${config.name} running on port ${config.port} in ${config.env}`,
  );
}

main();
