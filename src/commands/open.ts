import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { DateTime } from 'luxon';
import { Config } from '../config';
import { openInObsidian } from '../utils/obsidian';
import { getFilePath } from '../utils/files';

export async function openCommand(config: Config, dateOrKeyword?: string): Promise<void> {
  try {
    let targetPath: string | null = null;
    let potentialPaths: string[] = [];
    let suggestion = 'rkv new'; // Default suggestion

    if (!dateOrKeyword || dateOrKeyword === 'today') {
      const now = DateTime.now();
      // Order matters: check for evening first, then morning.
      potentialPaths = [getFilePath('evening', now), getFilePath('morning', now)];
    } else if (dateOrKeyword === 'yesterday') {
      const yesterday = DateTime.now().minus({ days: 1 });
      potentialPaths = [getFilePath('evening', yesterday), getFilePath('morning', yesterday)];
      suggestion = 'rkv new --yesterday';
    } else if (dateOrKeyword === 'week') {
      const weekStart = DateTime.now().startOf('week');
      potentialPaths = [getFilePath('weekly-start', weekStart)];
      suggestion = 'rkv new weekly-start';
    } else if (dateOrKeyword === 'captures' || dateOrKeyword === 'inbox') {
      potentialPaths = [path.join('inbox', `${DateTime.now().toFormat('yyyy-MM-dd')}-captures.md`)];
      suggestion = 'rkv log "your message"';
    } else {
      const parsed = DateTime.fromISO(dateOrKeyword);
      if (parsed.isValid) {
        potentialPaths = [getFilePath('evening', parsed), getFilePath('morning', parsed)];
        suggestion = `rkv new [type] --date ${parsed.toFormat('yyyy-MM-dd')}`;
      } else {
        console.log(chalk.red(`❌ Invalid date or keyword: ${dateOrKeyword}`));
        return;
      }
    }

    for (const p of potentialPaths) {
      const fullPath = path.join(config.vaultPath, p);
      if (await fs.pathExists(fullPath)) {
        targetPath = p;
        break; // Found the first valid path, stop searching.
      }
    }

    if (targetPath) {
      console.log(chalk.gray(`Opening: ${targetPath}`));
      await openInObsidian(targetPath, config);
    } else {
      console.log(chalk.yellow(`⚠️ Entry not found.`));
      console.log(chalk.gray(`To create a new entry, try: ${suggestion}`));
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to open entry:'), error.message);
    process.exit(1);
  }
}