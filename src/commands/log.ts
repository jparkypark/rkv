import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { DateTime } from 'luxon';
import { Config } from '../config';

export async function logCommand(config: Config, messageParts: string[]): Promise<void> {
  try {
    const message = messageParts.join(' ');
    const now = DateTime.now();
    
    // Create capture file path
    const captureFile = path.join(
      config.vaultPath,
      'inbox',
      `${now.toFormat('yyyy-MM-dd')}-captures.md`
    );
    
    // Ensure inbox directory exists
    await fs.ensureDir(path.join(config.vaultPath, 'inbox'));
    
    // Create file header if new
    if (!await fs.pathExists(captureFile)) {
      const header = `# Captures - ${now.toFormat('yyyy-MM-dd')}

`;
      await fs.writeFile(captureFile, header);
    }
    
    // Append capture with timestamp
    const timestamp = now.toFormat('HH:mm');
    const logEntry = `- ${timestamp} - ${message}
`;
    
    await fs.appendFile(captureFile, logEntry);
    
    console.log(chalk.green('✓ Logged capture'));
    
    // Optional: Show capture count
    const content = await fs.readFile(captureFile, 'utf-8');
    const captureCount = content.split('\n').filter(line => line.startsWith('- ')).length;
    console.log(chalk.gray(`  ${captureCount} captures today`));
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to log capture:'), error.message);
    process.exit(1);
  }
}