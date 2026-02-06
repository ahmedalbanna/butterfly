#!/usr/bin/env node

/**
 * 🗄️ Interactive Database Manager for Butterfly Store
 * 
 * This script provides an interactive terminal menu for all database operations:
 * - Generate Prisma client
 * - Create migrations
 * - Apply migrations
 * - Push schema changes
 * - Seed database
 * - View database (Prisma Studio)
 * - Reset database
 * - Check migration status
 */

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// Logger utility
const log = {
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  option: (num, msg) => console.log(`  ${colors.bright}${num}${colors.reset}. ${msg}`),
  input: (msg) => process.stdout.write(`${colors.magenta}${msg}${colors.reset}`),
};

// Execute command helper
function executeCommand(command, args = [], description = '') {
  return new Promise((resolve, reject) => {
    if (description) {
      log.info(description);
    }

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        if (description) {
          log.success(`Completed: ${description}`);
        }
        resolve(code);
      } else {
        log.error(`Failed with exit code ${code}`);
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (err) => {
      log.error(`Error: ${err.message}`);
      reject(err);
    });
  });
}

// Menu system
async function showMainMenu() {
  log.header();
  log.title('🗄️  DATABASE MANAGEMENT MENU');
  log.header();

  console.log(`
${colors.bright}Choose an option:${colors.reset}
`);
  log.option(1, 'Generate Prisma Client (db:generate)');
  log.option(2, 'Create New Migration (db:migrate)');
  log.option(3, 'Apply Pending Migrations (db:push)');
  log.option(4, 'View Migration Status (db:status)');
  log.option(5, 'Seed Database with Sample Data (db:seed)');
  log.option(6, 'Open Prisma Studio (db:studio)');
  log.option(7, 'Full Migration Dev Flow (db:dev)');
  log.option(8, 'Reset Database ⚠️ (db:reset)');
  log.option(9, 'Combined Setup (Generate + Push + Seed)');
  log.option(10, 'Exit');

  console.log();
  log.input('Enter your choice (1-10): ');

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Command descriptions
const commands = {
  1: {
    name: 'Generate Prisma Client',
    cmd: 'npx',
    args: ['prisma', 'generate'],
    desc: 'Generating Prisma Client...',
  },
  2: {
    name: 'Create Migration',
    cmd: 'npx',
    args: ['prisma', 'migrate', 'dev'],
    desc: 'Creating new migration...',
  },
  3: {
    name: 'Apply Migrations',
    cmd: 'npx',
    args: ['prisma', 'migrate', 'deploy'],
    desc: 'Applying pending migrations...',
  },
  4: {
    name: 'Migration Status',
    cmd: 'npx',
    args: ['prisma', 'migrate', 'status'],
    desc: 'Checking migration status...',
  },
  5: {
    name: 'Seed Database',
    cmd: 'npx',
    args: ['prisma', 'db', 'seed'],
    desc: 'Seeding database with sample data...',
  },
  6: {
    name: 'Prisma Studio',
    cmd: 'npx',
    args: ['prisma', 'studio'],
    desc: 'Opening Prisma Studio (http://localhost:5555)...',
  },
  7: {
    name: 'Full Dev Migration Flow',
    cmd: 'npx',
    args: ['prisma', 'migrate', 'dev'],
    desc: 'Running full migration dev flow...',
  },
  8: {
    name: 'Reset Database',
    cmd: 'npx',
    args: ['prisma', 'migrate', 'reset'],
    desc: 'Resetting database (this will delete all data!)...',
  },
};

// Confirm action
async function confirmAction(message) {
  log.warn(message);
  log.input('Type "yes" to confirm, or press Enter to cancel: ');

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

// Combined setup
async function combinedSetup() {
  const steps = [
    {
      name: 'Generate Prisma Client',
      cmd: 'npx',
      args: ['prisma', 'generate'],
      desc: 'Step 1/3: Generating Prisma Client...',
    },
    {
      name: 'Apply Migrations',
      cmd: 'npx',
      args: ['prisma', 'migrate', 'deploy'],
      desc: 'Step 2/3: Applying migrations...',
    },
    {
      name: 'Seed Database',
      cmd: 'npx',
      args: ['prisma', 'db', 'seed'],
      desc: 'Step 3/3: Seeding database...',
    },
  ];

  log.header();
  log.title('🚀 COMBINED SETUP (Generate + Push + Seed)');
  log.header();

  try {
    for (const step of steps) {
      await executeCommand(step.cmd, step.args, step.desc);
    }
    log.success('All setup steps completed successfully!');
  } catch (error) {
    log.error(`Setup failed at: ${error.message}`);
  }

  await pauseAndReturnToMenu();
}

// Ask for migration name
async function askMigrationName() {
  log.input('Enter migration name (or press Enter to auto-generate): ');

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Pause and return to menu
async function pauseAndReturnToMenu() {
  console.log();
  log.input('Press Enter to continue...');

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

// Main loop
async function main() {
  console.clear();
  log.title('🦋 Welcome to Butterfly Store Database Manager');
  log.info('Managing PostgreSQL database with Prisma ORM');

  let running = true;

  while (running) {
    const choice = await showMainMenu();

    switch (choice) {
      case '1': {
        // Generate Prisma Client
        log.header();
        log.title('Generating Prisma Client');
        log.header();
        try {
          await executeCommand(commands[1].cmd, commands[1].args, commands[1].desc);
        } catch (error) {
          log.error(error.message);
        }
        await pauseAndReturnToMenu();
        console.clear();
        break;
      }

      case '2': {
        // Create Migration
        log.header();
        log.title('Create New Migration');
        log.header();
        const migrationName = await askMigrationName();
        if (migrationName) {
          try {
            await executeCommand(commands[2].cmd, [...commands[2].args, '--name', migrationName], commands[2].desc);
          } catch (error) {
            log.error(error.message);
          }
        } else {
          log.info('Creating migration without name...');
          try {
            await executeCommand(commands[2].cmd, commands[2].args, commands[2].desc);
          } catch (error) {
            log.error(error.message);
          }
        }
        await pauseAndReturnToMenu();
        console.clear();
        break;
      }

      case '3': {
        // Apply Migrations
        log.header();
        log.title('Apply Pending Migrations');
        log.header();
        try {
          await executeCommand(commands[3].cmd, commands[3].args, commands[3].desc);
        } catch (error) {
          log.error(error.message);
        }
        await pauseAndReturnToMenu();
        console.clear();
        break;
      }

      case '4': {
        // Migration Status
        log.header();
        log.title('Migration Status');
        log.header();
        try {
          await executeCommand(commands[4].cmd, commands[4].args, commands[4].desc);
        } catch (error) {
          log.error(error.message);
        }
        await pauseAndReturnToMenu();
        console.clear();
        break;
      }

      case '5': {
        // Seed Database
        log.header();
        log.title('Seed Database');
        log.header();
        try {
          await executeCommand(commands[5].cmd, commands[5].args, commands[5].desc);
        } catch (error) {
          log.error(error.message);
        }
        await pauseAndReturnToMenu();
        console.clear();
        break;
      }

      case '6': {
        // Prisma Studio
        log.header();
        log.title('Opening Prisma Studio');
        log.header();
        log.info('Opening Prisma Studio at http://localhost:5555');
        log.info('Press Ctrl+C to close the studio and return to menu');
        try {
          await executeCommand(commands[6].cmd, commands[6].args);
        } catch (error) {
          log.error(error.message);
        }
        console.clear();
        break;
      }

      case '7': {
        // Full Dev Flow
        log.header();
        log.title('Full Migration Dev Flow');
        log.header();
        try {
          await executeCommand(commands[7].cmd, commands[7].args, commands[7].desc);
        } catch (error) {
          log.error(error.message);
        }
        await pauseAndReturnToMenu();
        console.clear();
        break;
      }

      case '8': {
        // Reset Database
        log.header();
        log.title('⚠️  RESET DATABASE');
        log.header();
        const confirmed = await confirmAction('This will DELETE ALL DATA from the database!');
        if (confirmed) {
          try {
            await executeCommand(commands[8].cmd, commands[8].args, commands[8].desc);
            log.success('Database reset completed');
          } catch (error) {
            log.error(error.message);
          }
        } else {
          log.warn('Database reset cancelled');
        }
        await pauseAndReturnToMenu();
        console.clear();
        break;
      }

      case '9': {
        // Combined Setup
        await combinedSetup();
        console.clear();
        break;
      }

      case '10': {
        // Exit
        log.header();
        log.success('Thank you for using Database Manager. Goodbye! 👋');
        log.header();
        running = false;
        process.exit(0);
        break;
      }

      default: {
        console.clear();
        log.error('Invalid choice. Please select a valid option.');
        await pauseAndReturnToMenu();
        console.clear();
      }
    }
  }
}

// Start the script
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
