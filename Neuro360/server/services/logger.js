const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Simple structured logger service
 * Logs to both console and file
 */
class Logger {
  constructor() {
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };

    // Default log level (increase in production)
    this.currentLevel = process.env.LOG_LEVEL ? this.levels[process.env.LOG_LEVEL] : 0;
  }

  /**
   * Format timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  formatLog(level, message, data) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      message,
      ...(data && { data })
    });
  }

  /**
   * Write to file
   */
  writeToFile(level, formattedLog) {
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    const allLogsFile = path.join(logsDir, 'app.log');

    // Don't log sensitive data
    const sanitized = formattedLog.replace(/token|password|secret|key|authorization/gi, '[REDACTED]');

    fs.appendFileSync(logFile, sanitized + '\n', 'utf8');
    fs.appendFileSync(allLogsFile, sanitized + '\n', 'utf8');
  }

  /**
   * Log at debug level
   */
  debug(message, data) {
    if (this.levels.DEBUG >= this.currentLevel) {
      const formatted = this.formatLog('DEBUG', message, data);
      console.log(`[DEBUG] ${message}`, data || '');
      this.writeToFile('DEBUG', formatted);
    }
  }

  /**
   * Log at info level
   */
  info(message, data) {
    if (this.levels.INFO >= this.currentLevel) {
      const formatted = this.formatLog('INFO', message, data);
      console.log(`[INFO] ${message}`, data || '');
      this.writeToFile('INFO', formatted);
    }
  }

  /**
   * Log at warn level
   */
  warn(message, data) {
    if (this.levels.WARN >= this.currentLevel) {
      const formatted = this.formatLog('WARN', message, data);
      console.warn(`[WARN] ${message}`, data || '');
      this.writeToFile('WARN', formatted);
    }
  }

  /**
   * Log at error level
   */
  error(message, error) {
    if (this.levels.ERROR >= this.currentLevel) {
      const errorData = {
        message: error?.message || error,
        stack: error?.stack || null,
        code: error?.code || null
      };

      const formatted = this.formatLog('ERROR', message, errorData);
      console.error(`[ERROR] ${message}`, errorData);
      this.writeToFile('ERROR', formatted);
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'DEBUG';
    const formatted = this.formatLog(level, `${req.method} ${req.path}`, logData);

    if (level === 'ERROR') {
      console.error(`[${level}] HTTP ${req.method} ${req.path} - ${res.statusCode}`, logData);
    } else if (level === 'WARN') {
      console.warn(`[${level}] HTTP ${req.method} ${req.path} - ${res.statusCode}`, logData);
    } else {
      console.log(`[${level}] HTTP ${req.method} ${req.path} - ${res.statusCode}`, logData);
    }

    this.writeToFile(level, formatted);
  }

  /**
   * Log database query
   */
  logQuery(query, duration, error = null) {
    const logData = {
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`,
      error: error || null
    };

    const level = error ? 'ERROR' : 'DEBUG';
    const formatted = this.formatLog(level, 'Database Query', logData);

    if (error) {
      console.error('[ERROR] Database Query', logData);
    } else {
      console.log('[DEBUG] Database Query', logData);
    }

    this.writeToFile(level, formatted);
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details) {
    const logData = {
      eventType,
      userId: details.userId || null,
      ip: details.ip || null,
      details: details.details || null
    };

    const formatted = this.formatLog('WARN', `Security Event: ${eventType}`, logData);
    console.warn(`[SECURITY] ${eventType}`, logData);
    this.writeToFile('WARN', formatted);
  }

  /**
   * Log audit trail
   */
  logAudit(action, resourceType, resourceId, userId, changes) {
    const logData = {
      action,
      resourceType,
      resourceId,
      userId,
      changes,
      timestamp: this.getTimestamp()
    };

    const formatted = this.formatLog('INFO', `Audit: ${action}`, logData);
    console.log(`[AUDIT] ${action}`, logData);
    this.writeToFile('INFO', formatted);
  }
}

// Export singleton instance
module.exports = new Logger();
