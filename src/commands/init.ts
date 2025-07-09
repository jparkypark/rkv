import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { DateTime } from 'luxon';
import { Config, saveConfig } from '../config';

export async function initCommand(config: Config): Promise<void> {
  try {
    console.log(chalk.blue('🚀 Welcome to RKV! Initializing your journal...'));
    console.log(chalk.gray('RKV is storage-agnostic and works with any folder location.\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'vaultPath',
        message: 'Enter the absolute path to your journal vault:',
        default: config.vaultPath,
        validate: (input: string) => {
          if (!input || input.trim() === '') {
            return 'Path cannot be empty.';
          }
          
          const trimmedInput = input.trim();
          
          if (!path.isAbsolute(trimmedInput)) {
            return 'Please provide an absolute path (starting with / on Unix/macOS or C:\\ on Windows).';
          }
          
          // Expand tilde for home directory
          const expandedPath = trimmedInput.startsWith('~') 
            ? path.join(require('os').homedir(), trimmedInput.slice(1))
            : trimmedInput;
          
          // Basic path validation
          try {
            path.resolve(expandedPath);
            return true;
          } catch (error) {
            return 'Invalid path format.';
          }
        },
        filter: (input: string) => {
          const trimmedInput = input.trim();
          // Expand tilde for home directory
          return trimmedInput.startsWith('~') 
            ? path.join(require('os').homedir(), trimmedInput.slice(1))
            : trimmedInput;
        }
      },
      {
        type: 'input',
        name: 'vaultName',
        message: 'Enter your vault name (for Obsidian integration):',
        default: (answers: any) => path.basename(answers.vaultPath || config.vaultPath),
        validate: (input: string) => {
          if (!input || input.trim() === '') {
            return 'Vault name cannot be empty.';
          }
          
          // Check for invalid characters that might cause issues with Obsidian URIs
          const invalidChars = /[<>:"|?*]/;
          if (invalidChars.test(input)) {
            return 'Vault name cannot contain: < > : " | ? *';
          }
          
          return true;
        },
        filter: (input: string) => input.trim()
      },
      {
        type: 'list',
        name: 'editor',
        message: 'Select your preferred editor:',
        choices: [
          { name: 'Obsidian (recommended)', value: 'obsidian' },
          { name: 'Visual Studio Code', value: 'code' },
          { name: 'Vim/Neovim', value: 'vim' }
        ],
        default: config.editor
      }
    ]);

    const newConfig: Config = {
      ...config,
      vaultPath: answers.vaultPath,
      vaultName: answers.vaultName,
      editor: answers.editor
    };
    
    console.log(chalk.blue(`\nSetting up vault at: ${newConfig.vaultPath}`));
    
    // Check if vault directory exists, create if it doesn't
    if (!await fs.pathExists(newConfig.vaultPath)) {
      console.log(chalk.blue('📁 Creating vault directory...'));
      await fs.ensureDir(newConfig.vaultPath);
      console.log(chalk.green(`✓ Created vault directory`));
    } else {
      // Check if directory is empty or has existing content
      const existingFiles = await fs.readdir(newConfig.vaultPath);
      if (existingFiles.length > 0) {
        console.log(chalk.yellow(`⚠️  Directory is not empty (${existingFiles.length} items found)`));
        
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Continue initializing in this directory?',
          default: true
        }]);
        
        if (!proceed) {
          console.log(chalk.gray('Initialization cancelled.'));
          return;
        }
      }
      console.log(chalk.blue(`📁 Using existing vault directory`));
    }
    
    // Save configuration before creating structure
    saveConfig(newConfig);
    console.log(chalk.green(`✓ Saved configuration to ~/.rkv/config.json`));

    console.log(chalk.blue('\n📂 Creating journal structure...'));
    
    const now = DateTime.now();
    
    // Create folder structure
    const folders = [
      `daily/${now.toFormat('yyyy')}/${now.toFormat('MM')}`,
      `weekly/${now.toFormat('yyyy')}`,
      `monthly/${now.toFormat('yyyy')}`,
      `quarterly/${now.toFormat('yyyy')}`,
      'inbox',
      '.templates' // Templates directory for user customization
    ];
    
    for (const folder of folders) {
      const fullPath = path.join(newConfig.vaultPath, folder);
      await fs.ensureDir(fullPath);
      console.log(chalk.green(`✓ Created ${folder}/`));
    }

    // Copy default templates to vault's .templates directory
    console.log(chalk.blue('\n📋 Setting up templates...'));
    const sourceTemplateDir = path.join(__dirname, '..', 'templates');
    const vaultTemplateDir = path.join(newConfig.vaultPath, '.templates');
    
    try {
      await fs.copy(sourceTemplateDir, vaultTemplateDir, { 
        overwrite: false, // Don't overwrite existing templates
        errorOnExist: false
      });
      console.log(chalk.green('✓ Copied default templates to .templates/'));
      
      // List the templates that were copied
      const templateFiles = await fs.readdir(vaultTemplateDir);
      const mdFiles = templateFiles.filter(file => file.endsWith('.md'));
      if (mdFiles.length > 0) {
        console.log(chalk.gray(`   Templates: ${mdFiles.join(', ')}`));
      }
    } catch (error: any) {
      console.log(chalk.yellow(`⚠️  Could not copy templates: ${error.message}`));
      console.log(chalk.gray('   You can manually copy templates later if needed.'));
    }
    
    // Create a welcome file
    const welcomeFile = path.join(newConfig.vaultPath, 'Welcome to RKV.md');
    if (!await fs.pathExists(welcomeFile)) {
      const welcomeContent = `# Welcome to RKV! 🚀

Your journal has been successfully initialized.

## Getting Started

- **Create a new entry**: \`rkv new\`
- **Quick capture thoughts**: \`rkv log "your thought here"\`
- **Open today's entry**: \`rkv open\`

## Folder Structure

- \`daily/\` - Daily morning and evening entries
- \`weekly/\` - Weekly planning and review
- \`monthly/\` - Monthly planning and review  
- \`quarterly/\` - Quarterly planning and review
- \`inbox/\` - Quick captures and unprocessed thoughts
- \`.templates/\` - Customizable entry templates

## Customization

You can edit the templates in the \`.templates/\` folder to customize your journal entries.

**Vault Path**: ${newConfig.vaultPath}
**Vault Name**: ${newConfig.vaultName}
**Editor**: ${newConfig.editor}

Happy journaling! 📝
`;

      await fs.writeFile(welcomeFile, welcomeContent);
      console.log(chalk.green('✓ Created welcome file'));
    }
    
    console.log(chalk.green('\n✨ RKV Journal initialized successfully!'));
    console.log(chalk.gray(`📍 Location: ${newConfig.vaultPath}`));
    console.log(chalk.gray(`🏷️  Vault Name: ${newConfig.vaultName}`));
    console.log(chalk.gray(`✏️  Editor: ${newConfig.editor}`));
    
    console.log(chalk.blue('\n🎯 Next Steps:'));
    console.log(chalk.gray('   • Create your first entry: rkv new'));
    console.log(chalk.gray('   • Customize templates in .templates/ folder'));
    if (newConfig.editor === 'obsidian') {
      console.log(chalk.gray('   • Open Obsidian and add this vault to access your journal'));
    }
    
  } catch (error: any) {
    console.error(chalk.red('\n❌ Initialization failed:'), error.message);
    
    // Provide specific guidance based on error type
    if (error.code === 'EACCES') {
      console.error(chalk.gray('   Permission denied. Check folder permissions.'));
    } else if (error.code === 'ENOSPC') {
      console.error(chalk.gray('   Insufficient disk space.'));
    } else if (error.code === 'ENOTDIR') {
      console.error(chalk.gray('   Path exists but is not a directory.'));
    }
    
    process.exit(1);
  }
}