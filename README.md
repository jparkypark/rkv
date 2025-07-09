# RKV - Professional Development Journaling

A command-line tool for structured professional development journaling that integrates with Obsidian and any storage location.

## Overview

RKV is a CLI tool designed to help professionals maintain consistent development journals with structured templates for daily, weekly, monthly, and quarterly entries. It emphasizes leadership growth, technical progress tracking, and quick capture capabilities.

## Features

- **Structured Journaling**: Morning/evening daily entries with leadership focus
- **Quick Capture**: Rapid logging to inbox for later processing
- **Smart Entry Management**: Intelligent opening of entries based on time and context
- **Obsidian Integration**: Seamless opening of entries in Obsidian
- **Storage Agnostic**: Works with any storage location (local, cloud sync, etc.)
- **Template System**: User-editable templates with cross-platform distribution
- **Cross-Platform Support**: Works on Windows, macOS, and Linux

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd rkv

# Install dependencies (includes cross-platform build tools)
npm install

# Build the project (includes template distribution)
npm run build

# Link for global use
npm link
```

## Quick Start

```bash
# Initialize your journal structure
rkv init

# Create a new journal entry (auto-detects morning/evening)
rkv new

# Quick capture to inbox
rkv log "Important meeting insight"

# Open today's entry
rkv open

# Open yesterday's entry
rkv open yesterday
```

## Commands

### `rkv init`
Initialize the journal structure in your chosen vault location, creating:
- `daily/YYYY/MM/` - Daily morning/evening entries
- `weekly/YYYY/` - Weekly start/end entries  
- `monthly/YYYY/` - Monthly start/end entries
- `quarterly/YYYY/` - Quarterly entries
- `inbox/` - Quick capture storage

### `rkv new [type]`
Create a new journal entry with template:
- `rkv new` - Auto-detects morning/evening based on time
- `rkv new morning` - Creates morning entry
- `rkv new evening` - Creates evening entry
- `rkv new weekly-start` - Creates weekly planning entry
- `rkv new --tomorrow` - Creates tomorrow's entry
- `rkv new --yesterday` - Creates yesterday's entry

### `rkv log <message>`
Quick capture to daily inbox file:
```bash
rkv log "Team blocked on API design decision"
rkv log "Potential optimization in user service"
```

### `rkv open [date|keyword]`
Open journal entries intelligently:
- `rkv open` or `rkv open today` - Opens today's appropriate entry
- `rkv open yesterday` - Opens yesterday's most recent entry
- `rkv open week` - Opens this week's planning entry
- `rkv open captures` - Opens today's capture file
- `rkv open 2024-01-15` - Opens specific date entry

## Entry Types & Templates

### Template System
RKV uses a user-editable template system:
- Templates are copied to `.templates/` in your vault during `rkv init`
- Templates support variable replacement (e.g., `{{date}}`, `{{date:format}}`)
- Templates are distributed with the CLI for consistent initialization
- Users can modify templates to customize entry formats

### Daily Morning
- Leadership focus checklist
- Priority work identification
- Team support planning

### Daily Evening
- Completed work documentation
- Leadership actions and outcomes
- Shadow ownership progress
- Friction point identification
- Tomorrow's opportunities

### Weekly Entries
- Weekly planning and review
- Team and project progress
- Strategic focus areas

### Quick Captures
- Timestamped entries in daily capture files
- Designed for rapid insight logging
- Processed later into structured entries

## Configuration

RKV uses a configuration file at `~/.rkv/config.json`:

```json
{
  "vaultPath": "/Users/you/RKV-Journal",
  "vaultName": "RKV-Journal",
  "editor": "obsidian",
  "defaultExtension": ".md"
}
```

**Configuration Features:**
- Automatic fallback to default settings if config is missing or corrupt
- Interactive setup during `rkv init` with path validation
- Cross-platform default paths (works with any storage location)

## Development

### Project Structure
```
src/
├── commands/          # Command implementations
│   ├── init.ts       # Initialize journal structure
│   ├── new.ts        # Create new entries
│   ├── log.ts        # Quick capture
│   └── open.ts       # Open entries
├── utils/            # Utility functions
│   ├── files.ts      # Cross-platform file path handling
│   └── obsidian.ts   # Obsidian integration
├── templates/        # Entry templates (distributed with build)
│   └── *.md          # Template markdown files
├── config.ts         # Configuration management
└── index.ts          # CLI entry point
```

### Development Scripts
```bash
npm run dev           # Run with ts-node
npm run build         # Compile TypeScript and copy templates
npm run copy-templates # Copy template files to dist/
npm run build:watch   # Watch mode compilation
npm run link          # Build and link globally
npm run clean         # Remove dist directory
npm run test          # Test CLI functionality
npm run test:build    # Build and test the distributable version
```

### Implementation Phases

The project follows a 4-phase implementation plan:

1. **Phase 1**: Project foundation and structure
2. **Phase 2**: Core commands & utilities (init, new)
3. **Phase 3**: Quick capture system (log, open)
4. **Phase 4**: Build and distribution

### Cross-Platform Compatibility

RKV is designed to work seamlessly across operating systems:

- **Path Handling**: Uses Node.js `path.join()` for cross-platform file paths
- **Template Distribution**: Templates are automatically copied during build process
- **Obsidian Integration**: Supports URI handlers on Windows, macOS, and Linux
- **Build Process**: Cross-platform build scripts using `copyfiles`

## File Organization

Entries are organized by type and date:
- `daily/2024/01/2024-01-15-morning.md`
- `daily/2024/01/2024-01-15-evening.md`
- `weekly/2024/2024-W03-start.md`
- `monthly/2024/2024-01-start.md`
- `inbox/2024-01-15-captures.md`

## Requirements

- Node.js 16+
- TypeScript
- Obsidian (for editing)
- Storage location of choice (local, Dropbox, Google Drive, iCloud, etc.)

## Future Enhancements

- `rkv review` - Process inbox captures
- `rkv search` - Find entries by content
- `rkv stats` - Track journaling consistency
- `rkv report` - Generate progress summaries

## Tech Stack

- **CLI Framework**: Commander.js
- **Language**: TypeScript
- **Date Handling**: Luxon
- **File System**: fs-extra
- **Styling**: Chalk
- **Build Tools**: copyfiles (cross-platform file copying)
- **User Input**: inquirer

## License

MIT License