#!/usr/bin/env node
import { Command } from 'commander';
import { Config, loadConfig } from './config';
import { initCommand } from './commands/init';
import { newCommand } from './commands/new';
import { logCommand } from './commands/log';
import { openCommand } from './commands/open';

const config = loadConfig();

const program = new Command();

program
  .name('rkv')
  .description('RKV - Professional development journaling')
  .version('0.1.0');

// Phase 2 commands - fully implemented
program
  .command('init')
  .description('Initialize RKV journal')
  .action(async () => {
    try {
      await initCommand(config);
    } catch (error: any) {
      console.error('Failed to initialize:', error.message);
      process.exit(1);
    }
  });

program
  .command('new [type]')
  .description('Create new journal entry')
  .option('-t, --tomorrow', 'Create tomorrow\'s entry')
  .option('-y, --yesterday', 'Create yesterday\'s entry')
  .option('-d, --date <date>', 'Create entry for a specific date (YYYY-MM-DD)')
  .action(async (type, options) => {
    try {
      await newCommand(config, type, options);
    } catch (error: any) {
      console.error('Failed to create entry:', error.message);
      process.exit(1);
    }
  });

program
  .command('log <message...>')
  .description('Quick capture to inbox')
  .action(async (messageParts) => {
    try {
      await logCommand(config, messageParts);
    } catch (error: any) {
      console.error('Failed to log capture:', error.message);
      process.exit(1);
    }
  });

program
  .command('open [date]')
  .description('Open journal entry')
  .action(async (date) => {
    try {
      await openCommand(config, date);
    } catch (error: any) {
      console.error('Failed to open entry:', error.message);
      process.exit(1);
    }
  });

program.parse();