interface Config {
  name: string;
  env: string;
  port: number;
}

interface RawConfig {
  name?: string;
  env?: string;
  port?: string;
}

export function parseConfig(raw: RawConfig): Config {
  return {
    name: (raw.name ?? "unnamed").trim(),
    env: (raw.env ?? "development").trim(),
    port: parseInt(raw.port ?? "3000", 10),
  };
}
