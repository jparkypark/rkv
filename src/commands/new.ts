import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { DateTime } from 'luxon';
import { Config } from '../config';
import { getFilePath, processTemplate, validateEntryType, getDefaultEntryType } from '../utils/files';
import { openInObsidian } from '../utils/obsidian';

interface NewCommandOptions {
  tomorrow?: boolean;
  yesterday?: boolean;
  date?: string;
}

function getTemplateKey(type: string): string {
  const templateMap: Record<string, string> = {
    'morning': 'daily-morning',
    'evening': 'daily-evening',
    'weekly-start': 'weekly-start',
    'weekly-end': 'weekly-end',
    'monthly-start': 'monthly-start',
    'monthly-end': 'monthly-end'
  };
  return templateMap[type] || `daily-${type}`;
}

function parseTargetDate(options: NewCommandOptions): DateTime {
  const now = DateTime.now();
  
  if (options.date) {
    // Parse ISO date string
    const parsedDate = DateTime.fromISO(options.date);
    if (!parsedDate.isValid) {
      throw new Error(`Invalid date format: ${options.date}. Please use YYYY-MM-DD format.`);
    }
    return parsedDate;
  } else if (options.tomorrow) {
    return now.plus({ days: 1 });
  } else if (options.yesterday) {
    return now.minus({ days: 1 });
  } else {
    return now;
  }
}

export async function newCommand(config: Config, type?: string, options: NewCommandOptions = {}): Promise<void> {
  try {
    // Validate vault exists
    if (!await fs.pathExists(config.vaultPath)) {
      console.error(chalk.red('❌ Vault not found!'));
      console.error(chalk.gray(`   Expected location: ${config.vaultPath}`));
      console.error(chalk.gray('   Run "rkv init" to initialize your vault first.'));
      return;
    }

    // Determine entry type
    let entryType = type;
    if (!entryType) {
      entryType = getDefaultEntryType();
      console.log(chalk.gray(`Using default entry type: ${entryType}`));
    }

    // Validate entry type
    if (!validateEntryType(entryType)) {
      console.error(chalk.red(`❌ Invalid entry type: ${entryType}`));
      console.error(chalk.gray('   Valid types: morning, evening, weekly-start, weekly-end, monthly-start, monthly-end'));
      return;
    }
    
    // Parse target date
    let targetDate: DateTime;
    try {
      targetDate = parseTargetDate(options);
    } catch (error: any) {
      console.error(chalk.red(`❌ ${error.message}`));
      return;
    }
    
    // Generate file path
    const filePath = getFilePath(entryType, targetDate);
    const fullPath = path.join(config.vaultPath, filePath);
    
    // Check if entry already exists
    if (await fs.pathExists(fullPath)) {
      console.log(chalk.yellow(`⚠️  Entry already exists: ${filePath}`));
      console.log(chalk.gray('Opening existing entry...'));
    } else {
      // Load template
      const templateKey = getTemplateKey(entryType);
      const templatePath = path.join(config.vaultPath, '.templates', `${templateKey}.md`);

      // Check if custom template exists in vault, fall back to source templates
      let templateContent: string;
      if (await fs.pathExists(templatePath)) {
        templateContent = await fs.readFile(templatePath, 'utf-8');
        console.log(chalk.gray(`Using vault template: .templates/${templateKey}.md`));
      } else {
        // Fall back to source template
        const sourceTemplatePath = path.join(__dirname, '..', 'templates', `${templateKey}.md`);
        if (await fs.pathExists(sourceTemplatePath)) {
          templateContent = await fs.readFile(sourceTemplatePath, 'utf-8');
          console.log(chalk.gray(`Using default template: ${templateKey}.md`));
        } else {
          console.error(chalk.red(`❌ Template not found: ${templateKey}.md`));
          console.error(chalk.gray('   Check that templates exist in .templates/ directory'));
          console.error(chalk.gray('   Run "rkv init" to restore default templates'));
          return;
        }
      }

      // Process template with date variables
      const processedContent = processTemplate(templateContent, { date: targetDate });
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(fullPath));
      
      // Write file
      await fs.writeFile(fullPath, processedContent, 'utf-8');
      
      const dateStr = targetDate.toFormat('yyyy-MM-dd');
      console.log(chalk.green(`✓ Created ${entryType} entry for ${dateStr}`));
      console.log(chalk.gray(`  Location: ${filePath}`));
    }
    
    // Open in configured editor
    if (config.editor === 'obsidian') {
      await openInObsidian(filePath, config);
    } else {
      console.log(chalk.blue(`📝 Open with ${config.editor}: ${fullPath}`));
      
      // Provide platform-specific instructions for other editors
      if (config.editor === 'code') {
        console.log(chalk.gray(`   Command: code "${fullPath}"`));
      } else if (config.editor === 'vim') {
        console.log(chalk.gray(`   Command: vim "${fullPath}"`));
      }
    }
    
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to create new entry:'));
    
    // Provide specific guidance based on error type
    if (error.code === 'EACCES') {
      console.error(chalk.gray('   Permission denied. Check file/folder permissions.'));
    } else if (error.code === 'ENOSPC') {
      console.error(chalk.gray('   Insufficient disk space.'));
    } else if (error.code === 'ENOENT') {
      console.error(chalk.gray('   File or directory not found.'));
      console.error(chalk.gray('   Make sure the vault is properly initialized with "rkv init".'));
    } else {
      console.error(chalk.gray(`   ${error.message}`));
    }
    
    process.exit(1);
  }
}

// Helper function to suggest entry types based on current time and date
export function suggestEntryType(date: DateTime = DateTime.now()): string {
  const hour = date.hour;
  const dayOfWeek = date.weekday; // 1 = Monday, 7 = Sunday
  const isMonday = dayOfWeek === 1;
  const isFriday = dayOfWeek === 5;
  const isFirstOfMonth = date.day === 1;
  const isLastOfMonth = date.day === date.daysInMonth;
  
  // Priority order for suggestions
  if (isFirstOfMonth) return 'monthly-start';
  if (isLastOfMonth) return 'monthly-end';
  if (isMonday) return 'weekly-start';
  if (isFriday) return 'weekly-end';
  
  // Default to daily entries
  return hour < 12 ? 'morning' : 'evening';
}