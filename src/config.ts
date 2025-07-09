import os from 'os';
import path from 'path';
import fs from 'fs-extra';

export interface Config {
  vaultPath: string;
  vaultName: string;
  editor: 'obsidian' | 'code' | 'vim';
  defaultExtension: string;
}

export const DEFAULT_CONFIG: Config = {
  vaultPath: path.join(os.homedir(), 'Google Drive', 'RKV-Journal'),
  vaultName: 'RKV-Journal',
  editor: 'obsidian',
  defaultExtension: '.md'
};

export function loadConfig(): Config {
  const configPath = path.join(os.homedir(), '.rkv', 'config.json');
  try {
    const userConfig = fs.readJsonSync(configPath);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    // If file doesn't exist or is corrupt, fs.readJsonSync will throw.
    // We can safely ignore the error and return defaults.
    // For a more robust solution, we could check error.code === 'ENOENT'
    // but for this purpose, any read error should result in defaults.
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Config): void {
  const configDir = path.join(os.homedir(), '.rkv');
  fs.ensureDirSync(configDir);
  fs.writeJsonSync(path.join(configDir, 'config.json'), config, { spaces: 2 });
}