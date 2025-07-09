#!/usr/bin/env node
import { Command } from 'commander';
import { Config, loadConfig } from './config';

const config = loadConfig();

const program = new Command();

program
  .name('rkv')
  .description('RKV - Professional development journaling')
  .version('0.1.0');

// Placeholder commands - implementations will be added in later phases
program
  .command('init')
  .description('Initialize RKV journal')
  .action(() => {
    console.log('Init command - PLACEHOLDER: Full implementation in Phase 2');
  });

program
  .command('new [type]')
  .description('Create new journal entry')
  .option('-t, --tomorrow', 'Create tomorrow\'s entry')
  .option('-y, --yesterday', 'Create yesterday\'s entry')
  .option('-d, --date <date>', 'Create entry for a specific date (YYYY-MM-DD)')
  .action((type, options) => {
    console.log('New command - PLACEHOLDER: Full implementation in Phase 2');
  });

program
  .command('log <message...>')
  .description('Quick capture to inbox')
  .action((messageParts) => {
    console.log('Log command - PLACEHOLDER: Full implementation in Phase 3');
  });

program
  .command('open [date]')
  .description('Open journal entry')
  .action((date) => {
    console.log('Open command - PLACEHOLDER: Full implementation in Phase 3');
  });

program.parse();