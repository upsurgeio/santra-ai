import chalk from 'chalk';

/**
 * Comprehensive logger module with colored console output, timestamps, and levels
 */
class Logger {
  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `${chalk.gray(`[${timestamp}]`)} ${level} ${message}`;
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

export default new Logger();
