## RKV Implementation Plan for Claude Code

### Project Setup & Structure

**Goal**: Create a working CLI tool that integrates with Obsidian and any storage location

**Tech Stack**:
- Node.js with TypeScript for better code clarity
- Commander.js for CLI framework
- Obsidian (already installed) as editor
- Storage-agnostic (works with any folder location - local, cloud sync, etc.)

---

### Phase 1: Project Foundation (Day 1)

#### Step 1.1: Initialize Project
```bash
# Initialize npm project
npm init -y

# Install dependencies
npm install --save commander chalk luxon fs-extra inquirer
npm install --save-dev @types/node @types/fs-extra @types/luxon @types/inquirer typescript ts-node copyfiles

# Create source structure
mkdir -p src/{commands,utils,templates}
touch src/index.ts src/config.ts

# Create TypeScript configuration
npx tsc --init
```

**Expected outcome**: Basic TypeScript project with dependencies and template files installed

**Additional setup**: After npm init, update package.json name to "rkv" and add basic scripts. After tsc --init, configure tsconfig.json with proper outDir and rootDir settings.

#### Step 1.2: Create Configuration System
Create `src/config.ts`:
```typescript
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
  vaultPath: path.join(os.homedir(), 'RKV-Journal'),
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
```

**Expected outcome**: Configuration system that reads/writes to `~/.rkv/config.json` and gracefully handles parsing errors.

#### Step 1.3: Create CLI Entry Point
Create `src/index.ts` with placeholder commands (actual implementations added in later phases):
```typescript
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
```

**Expected outcome**: Basic CLI that can be run with `npm run dev` and shows placeholder messages

---

### Phase 2: Core Commands & Utilities (Day 2)

#### Step 2.1: Create File Utilities
Create `src/utils/files.ts`:
```typescript
import { DateTime } from 'luxon';
import path from 'path';

export function getFilePath(type: string, date: DateTime): string {
  const year = date.toFormat('yyyy');
  const month = date.toFormat('MM');
  const dateStr = date.toFormat('yyyy-MM-dd');
  const week = date.toFormat("'W'WW");
  
  switch (type) {
    case 'morning':
    case 'evening':
      return path.join('daily', year, month, `${dateStr}-${type}.md`);
    
    case 'weekly-start':
    case 'weekly-end':
      return path.join('weekly', year, `${year}-${week}-${type.split('-')[1]}.md`);
    
    case 'monthly-start':
    case 'monthly-end':
      return path.join('monthly', year, `${year}-${month}-${type.split('-')[1]}.md`);
    
    default:
      throw new Error(`Unknown entry type: ${type}`);
  }
}

export function processTemplate(template: string, vars: { date: DateTime }): string {
  let processed = template;
  
  // Basic date replacement
  processed = processed.replace(/{{date}}/g, vars.date.toFormat('yyyy-MM-dd'));
  
  // Format-specific date replacement
  processed = processed.replace(/{{date:([^}]+)}}/g, (_, format) => {
    return vars.date.toFormat(format);
  });
  
  return processed;
}
```

**Expected outcome**: Utility functions for file paths and template processing

#### Step 2.2: Create Obsidian Integration
Create `src/utils/obsidian.ts`:
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { Config } from '../config';

const execAsync = promisify(exec);

export async function openInObsidian(filePath: string, config: Config): Promise<void> {
  const uri = `obsidian://open?vault=${encodeURIComponent(config.vaultName)}&file=${encodeURIComponent(filePath)}`;
  
  const platform = process.platform;
  let command: string;
  
  switch (platform) {
    case 'darwin':
      command = `open "${uri}"`;
      break;
    case 'win32':
      command = `start "" "${uri}"`;
      break;
    default:
      command = `xdg-open "${uri}"`;
  }
  
  try {
    await execAsync(command);
  } catch (error) {
    console.error('Failed to open in Obsidian. Is Obsidian installed and is the obsidian:// URI handler configured correctly?');
  }
}
```

**Expected outcome**: Reliable Obsidian integration across platforms with helpful error messages.

#### Step 2.3: Implement Init Command
Create `src/commands/init.ts`:
```typescript
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { DateTime } from 'luxon';
import { Config, saveConfig } from '../config';

export async function initCommand(config: Config): Promise<void> {
  try {
    console.log(chalk.blue('🚀 Welcome to RKV! Initializing your journal...'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'vaultPath',
        message: 'Please enter the absolute path to your journal vault:',
        default: config.vaultPath, // Default suggestion - user can choose any location
        validate: (input) => {
          if (!input) return 'Path cannot be empty.';
          if (!path.isAbsolute(input)) return 'Please provide an absolute path.';
          return true;
        },
      },
      {
        type: 'input',
        name: 'vaultName',
        message: 'Please enter your vault name (for Obsidian integration):',
        default: path.basename(answers.vaultPath || config.vaultPath),
        validate: (input) => input ? true : 'Vault name cannot be empty.',
      },
    ]);

    const newConfig = { ...config, vaultPath: answers.vaultPath, vaultName: answers.vaultName };
    
    // Check if vault directory exists, create if it doesn't
    if (!await fs.pathExists(newConfig.vaultPath)) {
      console.log(chalk.blue(`\nVault directory doesn't exist. Creating: ${newConfig.vaultPath}`));
      await fs.ensureDir(newConfig.vaultPath);
      console.log(chalk.green(`✓ Created vault directory`));
    } else {
      console.log(chalk.blue(`\nUsing existing vault directory: ${newConfig.vaultPath}`));
    }
    
    saveConfig(newConfig); // Save the user-provided path

    console.log(chalk.blue('\nCreating journal structure...'));
    
    const now = DateTime.now();
    
    // Create folder structure
    const folders = [
      `daily/${now.toFormat('yyyy')}/${now.toFormat('MM')}`,
      `weekly/${now.toFormat('yyyy')}`,
      `monthly/${now.toFormat('yyyy')}`,
      `quarterly/${now.toFormat('yyyy')}`,
      'inbox'
    ];
    
    for (const folder of folders) {
      const fullPath = path.join(newConfig.vaultPath, folder);
      await fs.ensureDir(fullPath);
      console.log(chalk.green(`✓ Created ${folder}`));
    }

    // Create templates directory
    const templateDir = path.join(__dirname, '..', 'templates');
    const vaultTemplateDir = path.join(newConfig.vaultPath, '.templates');
    await fs.copy(templateDir, vaultTemplateDir);
    console.log(chalk.green('✓ Copied default templates'));
    
    console.log(chalk.green('\n✨ RKV Journal initialized successfully!'));
    console.log(chalk.gray(`Journal location set to: ${newConfig.vaultPath}`));
  } catch (error) {
    console.error(chalk.red('❌ Initialization failed:'), error.message);
    process.exit(1);
  }
}
```

**Expected outcome**: Running `rkv init` prompts for a vault path and name, automatically creates the vault directory if it doesn't exist, saves the configuration, creates the journal folder structure, and copies the default templates into the vault. Works with any storage location (local, Dropbox, Google Drive, iCloud, etc.).

#### Step 2.4: Implement New Command
Create `src/commands/new.ts`:
```typescript
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { DateTime } from 'luxon';
import { Config } from '../config';
import { getFilePath, processTemplate } from '../utils/files';
import { openInObsidian } from '../utils/obsidian';

function getTemplateKey(type: string): string {
  const templateMap = {
    'morning': 'daily-morning',
    'evening': 'daily-evening',
    'weekly-start': 'weekly-start',
    'weekly-end': 'weekly-end',
    'monthly-start': 'monthly-start',
    'monthly-end': 'monthly-end'
  };
  return templateMap[type] || `daily-${type}`;
}

export async function newCommand(config: Config, type?: string, options?: any): Promise<void> {
  try {
    const now = DateTime.now();
    
    // Determine entry type
    if (!type) {
      const hour = now.hour;
      type = hour < 12 ? 'morning' : 'evening';
    }
    
    // Determine date
    let targetDate: DateTime;
    if (options?.date) {
      const parsedDate = DateTime.fromISO(options.date);
      if (!parsedDate.isValid) {
        console.log(chalk.red(`❌ Invalid date format for --date. Please use YYYY-MM-DD.`));
        return;
      }
      targetDate = parsedDate;
    } else if (options?.tomorrow) {
      targetDate = now.plus({ days: 1 });
    } else if (options?.yesterday) {
      targetDate = now.minus({ days: 1 });
    } else {
      targetDate = now;
    }
    
    // Create entry
    const filePath = getFilePath(type, targetDate);
    const fullPath = path.join(config.vaultPath, filePath);
    
    // Check if already exists
    if (await fs.pathExists(fullPath)) {
      console.log(chalk.yellow(`⚠️  Entry already exists: ${filePath}`));
      console.log(chalk.gray('Opening existing entry...'));
    } else {
      // Load and process template
      const templateKey = getTemplateKey(type);
      const templatePath = path.join(config.vaultPath, '.templates', `${templateKey}.md`);

      if (!await fs.pathExists(templatePath)) {
        console.log(chalk.red(`❌ Template not found: ${templatePath}`));
        return;
      }

      const template = await fs.readFile(templatePath, 'utf-8');
      const content = processTemplate(template, { date: targetDate });
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(fullPath));
      
      // Write file
      await fs.writeFile(fullPath, content);
      console.log(chalk.green(`✓ Created ${type} entry: ${filePath}`));
    }
    
    // Open in Obsidian
    await openInObsidian(filePath, config);
  } catch (error) {
    console.error(chalk.red('❌ Failed to create new entry:'), error.message);
    process.exit(1);
  }
}
```

**Expected outcome**: `rkv new` creates entries from user-editable template files in the vault and opens them.

#### Step 2.5: Update CLI Integration
Update `src/index.ts` to use the implemented commands:
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { Config, loadConfig } from './config';
import { initCommand } from './commands/init';
import { newCommand } from './commands/new';

const config = loadConfig();

const program = new Command();

program
  .name('rkv')
  .description('RKV - Professional development journaling')
  .version('0.1.0');

// Implemented commands
program
  .command('init')
  .description('Initialize RKV journal')
  .action(() => initCommand(config));

program
  .command('new [type]')
  .description('Create new journal entry')
  .option('-t, --tomorrow', 'Create tomorrow\'s entry')
  .option('-y, --yesterday', 'Create yesterday\'s entry')
  .option('-d, --date <date>', 'Create entry for a specific date (YYYY-MM-DD)')
  .action((type, options) => newCommand(config, type, options));

// Placeholder commands - will be implemented in Phase 3
program
  .command('log <message...>')
  .description('Quick capture to inbox')
  .action((messageParts) => {
    console.log('Log command - to be implemented in Phase 3');
  });

program
  .command('open [date]')
  .description('Open journal entry')
  .action((date) => {
    console.log('Open command - to be implemented in Phase 3');
  });

program.parse();
```

**Expected outcome**: `init` and `new` commands now execute actual implementations

---

### Phase 3: Quick Capture System (Day 3)

#### Step 3.1: Implement Log Command
Create `src/commands/log.ts`:
```typescript
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
  } catch (error) {
    console.error(chalk.red('❌ Failed to log capture:'), error.message);
    process.exit(1);
  }
}
```

**Expected outcome**: `rkv log "message"` creates/appends to daily capture file

#### Step 3.2: Implement Open Command
Create `src/commands/open.ts`:
```typescript
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
  } catch (error) {
    console.error(chalk.red('❌ Failed to open entry:'), error.message);
    process.exit(1);
  }
}
```

**Expected outcome**: `rkv open` intelligently opens the right entry, or provides a helpful message if it doesn't exist.

#### Step 3.3: Update CLI Integration
Update `src/index.ts` to use all implemented commands:
```typescript
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

// All commands now implemented
program
  .command('init')
  .description('Initialize RKV journal')
  .action(() => initCommand(config));

program
  .command('new [type]')
  .description('Create new journal entry')
  .option('-t, --tomorrow', 'Create tomorrow\'s entry')
  .option('-y, --yesterday', 'Create yesterday\'s entry')
  .option('-d, --date <date>', 'Create entry for a specific date (YYYY-MM-DD)')
  .action((type, options) => newCommand(config, type, options));

program
  .command('log <message...>')
  .description('Quick capture to inbox')
  .action((messageParts) => logCommand(config, messageParts));

program
  .command('open [date]')
  .description('Open journal entry')
  .action((date) => openCommand(config, date));

program.parse();
```

**Expected outcome**: All commands now execute actual implementations

---

### Phase 4: Build & Distribution (Day 4)

#### Step 4.1: Add Build Configuration
Update `package.json`:
```json
{
  "name": "rkv",
  "version": "0.1.0",
  "description": "RKV - Professional development journaling",
  "main": "dist/index.js",
  "bin": {
    "rkv": "dist/index.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "npm run clean && tsc && npm run copy-templates",
    "copy-templates": "copyfiles -u 1 \"src/templates/**/*.md\" dist",
    "build:watch": "tsc --watch",
    "dev": "ts-node src/index.ts",
    "dev:watch": "ts-node --watch src/index.ts",
    "link": "npm run build && npm link",
    "unlink": "npm unlink -g rkv",
    "clean": "rm -rf dist",
    "test": "ts-node src/index.ts",
    "test:build": "npm run build && node dist/index.js"
  }
}
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Expected outcome**: `npm run build` creates distributable JS files

#### Step 4.2: Create Development Link
```bash
# Build and link for development
npm run build
npm link

# Test commands
rkv init
rkv new morning
rkv log "First test capture"
rkv open
```

**Expected outcome**: `rkv` command available globally on your system

---

### Testing Checklist

After each phase, verify:

**Phase 1**: 
- [ ] Project structure created
- [ ] TypeScript compiles without errors
- [ ] Basic CLI help works: `ts-node src/index.ts --help`

**Phase 2**:
- [ ] `rkv init` prompts for a vault path and saves it correctly
- [ ] `rkv init` creates a `.templates` folder in the vault with default templates
- [ ] `rkv new` reads from the `.md` template files in the vault
- [ ] `rkv new --date YYYY-MM-DD` creates an entry for the specified date
- [ ] A user can modify a template and the `new` command will use the new content
- [ ] Obsidian opens with new entries reliably

**Phase 3**:
- [ ] `rkv log` creates and appends to daily capture files
- [ ] `rkv open` works with all keywords (today, yesterday, week, captures)
- [ ] `rkv open` intelligently selects the correct existing file
- [ ] `rkv open` shows a helpful message when a file does not exist

**Phase 4**:
- [ ] `npm run build` succeeds
- [ ] `rkv` command works globally after `npm link`
- [ ] All commands function correctly using the built distributable

---

### Next Steps

Once core commands work:
1. Add `rkv review` for processing captures
2. Implement `rkv search` for finding entries
3. Add `rkv stats` for tracking consistency
4. Create `rkv report` for generating summaries

This implementation plan gives you a working journaling system in 4 focused development sessions!
