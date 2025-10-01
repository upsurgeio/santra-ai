#!/usr/bin/env node

import { createLogger } from './logger.js';

const logger = createLogger('CLI');

/**
 * Simple CLI tool to test Santra AI idea processing
 * Usage: node src/cli.js "your idea here"
 */
async function main() {
  const idea = process.argv.slice(2).join(' ');

  if (!idea) {
    logger.error('Please provide an idea as argument: node src/cli.js "your idea"');
    process.exit(1);
  }

  try {
    logger.info(`Sending idea to server: ${idea.substring(0, 50)}...`);

    const response = await fetch('http://localhost:3000/process-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    logger.success('Idea processed successfully!');
    console.log('\nProcessed Result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    logger.error(`Failed to process idea: ${error.message}`);
    process.exit(1);
  }
}

main();
