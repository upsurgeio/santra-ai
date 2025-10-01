import chalk from 'chalk';

/**
 * Comprehensive logger module with colored console output, timestamps, levels, and naming
 */
class Logger {
  constructor(name = 'App') {
    this.name = name;
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `${chalk.gray(`[${timestamp}]`)} ${chalk.cyan(`[${this.name}]`)} ${level} ${message}`;
  }

  info(message) {
    console.log(this._formatMessage(chalk.blue('[INFO]'), message));
  }

  warn(message) {
    console.log(this._formatMessage(chalk.yellow('[WARN]'), message));
  }

  error(message) {
    console.error(this._formatMessage(chalk.red('[ERROR]'), message));
  }

  success(message) {
    console.log(this._formatMessage(chalk.green('[SUCCESS]'), message));
  }

  debug(message) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this._formatMessage(chalk.magenta('[DEBUG]'), message));
    }
  }
}

/**
 * Create a named logger instance
 * @param {string} name - Logger name for identification
 * @returns {Logger} - New logger instance
 */
export function createLogger(name) {
  return new Logger(name);
}

// Default logger for backward compatibility
export default new Logger('App');
