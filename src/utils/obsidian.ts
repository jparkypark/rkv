import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { Config } from '../config';

const execAsync = promisify(exec);

export async function openInObsidian(filePath: string, config: Config): Promise<void> {
  try {
    // Ensure file path doesn't have leading slash for URI encoding
    const cleanFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Construct Obsidian URI - vault name and file path must be URL encoded
    const uri = `obsidian://open?vault=${encodeURIComponent(config.vaultName)}&file=${encodeURIComponent(cleanFilePath)}`;
    
    // Determine platform-specific command
    const platform = process.platform;
    let command: string;
    
    switch (platform) {
      case 'darwin': // macOS
        command = `open "${uri}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${uri}"`;
        break;
      case 'linux': // Linux
        command = `xdg-open "${uri}"`;
        break;
      default:
        // Fallback for other Unix-like systems
        command = `xdg-open "${uri}"`;
        console.warn(chalk.yellow(`⚠️  Untested platform: ${platform}. Using xdg-open as fallback.`));
    }
    
    console.log(chalk.gray(`Opening in Obsidian: ${cleanFilePath}`));
    
    // Execute the command with a timeout
    await execAsync(command, { timeout: 5000 });
    
  } catch (error: any) {
    // Provide helpful error messages based on the type of failure
    if (error.code === 'ENOENT') {
      console.error(chalk.red('❌ Failed to open in Obsidian:'));
      console.error(chalk.gray('   Command not found. Please ensure you have the appropriate system tools:'));
      console.error(chalk.gray('   • macOS: Should work out of the box'));
      console.error(chalk.gray('   • Windows: Ensure "start" command is available'));
      console.error(chalk.gray('   • Linux: Install xdg-utils package'));
    } else if (error.signal === 'SIGTERM') {
      console.error(chalk.red('❌ Obsidian open command timed out.'));
      console.error(chalk.gray('   This may happen if Obsidian is not installed or the URI handler is not configured.'));
    } else {
      console.error(chalk.red('❌ Failed to open in Obsidian:'));
      console.error(chalk.gray(`   ${error.message}`));
    }
    
    // Provide helpful guidance
    console.error(chalk.yellow('\n💡 Troubleshooting:'));
    console.error(chalk.gray('   1. Ensure Obsidian is installed and has been opened at least once'));
    console.error(chalk.gray('   2. Verify the vault name matches exactly (case-sensitive)'));
    console.error(chalk.gray(`   3. Check that the vault "${config.vaultName}" exists in Obsidian`));
    console.error(chalk.gray('   4. Try opening the file manually to verify the path is correct'));
  }
}

export function generateObsidianURI(vaultName: string, filePath: string): string {
  // Clean file path and generate URI for external use
  const cleanFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(cleanFilePath)}`;
}

export function isPlatformSupported(): boolean {
  const platform = process.platform;
  return ['darwin', 'win32', 'linux'].includes(platform);
}

export function getPlatformOpenCommand(): string {
  const platform = process.platform;
  
  switch (platform) {
    case 'darwin':
      return 'open';
    case 'win32':
      return 'start';
    case 'linux':
      return 'xdg-open';
    default:
      return 'xdg-open';
  }
}