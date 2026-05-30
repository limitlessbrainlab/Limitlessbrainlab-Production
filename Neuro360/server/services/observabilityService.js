/**
 * Observability Service - Error Tracking, Monitoring, Alerts
 * Points 20-23: Logging, Error Tracking, Monitoring, Alerts
 */

const logger = require('./logger');
const fs = require('fs');
const path = require('path');

/**
 * Error Tracker - Track and group errors
 * Point 21: Error Tracking
 */
class ErrorTracker {
  constructor() {
    this.errors = [];
    this.errorGroups = new Map();
    this.maxErrors = 1000;
  }

  /**
   * Track error occurrence
   */
  trackError(error, context = {}) {
    const errorSignature = this.generateSignature(error);

    if (!this.errorGroups.has(errorSignature)) {
      this.errorGroups.set(errorSignature, {
        signature: errorSignature,
        message: error.message,
        stack: error.stack,
        count: 0,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        contexts: []
      });
    }

    const group = this.errorGroups.get(errorSignature);
    group.count++;
    group.lastOccurrence = new Date();
    group.contexts.push({
      timestamp: new Date(),
      context: context,
      userId: context.userId || 'anonymous'
    });

    // Keep only last 50 contexts per error
    if (group.contexts.length > 50) {
      group.contexts.shift();
    }

    // Log error
    logger.error(`Error tracked: ${error.message}`, {
      signature: errorSignature,
      count: group.count,
      context
    });

    // Limit total errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * Generate error signature for grouping
   */
  generateSignature(error) {
    // Use first line of stack trace for grouping
    const stackLine = (error.stack || '').split('\n')[1] || '';
    return `${error.name}::${error.message}::${stackLine}`.substring(0, 200);
  }

  /**
   * Get error groups report
   */
  getReport(limit = 20) {
    return Array.from(this.errorGroups.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(g => ({
        ...g,
        contexts: undefined // Don't include detailed contexts in report
      }));
  }

  /**
   * Get specific error details
   */
  getErrorDetails(signature) {
    return this.errorGroups.get(signature);
  }

  /**
   * Clear errors
   */
  clear() {
    this.errors = [];
    this.errorGroups.clear();
  }
}

/**
 * Metrics Collector - Track system metrics
 * Point 22: Monitoring
 */
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: [],
      responses: [],
      errors: [],
      database: [],
      memory: [],
      cpu: []
    };

    this.currentMetrics = {
      totalRequests: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
      dbConnections: 0,
      memoryUsage: 0,
      uptime: Date.now()
    };
  }

  /**
   * Record API request
   */
  recordRequest(method, path, duration, status) {
    this.metrics.requests.push({
      timestamp: new Date(),
      method,
      path,
      duration,
      status
    });

    this.currentMetrics.totalRequests++;
    this.currentMetrics.totalResponseTime += duration;
    this.currentMetrics.avgResponseTime = Math.round(
      this.currentMetrics.totalResponseTime / this.currentMetrics.totalRequests
    );

    if (status >= 400) {
      this.currentMetrics.totalErrors++;
    }

    // Keep only last 1000 requests
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests.shift();
    }
  }

  /**
   * Record database connection
   */
  recordDbConnection(count) {
    this.currentMetrics.dbConnections = count;
    this.metrics.database.push({
      timestamp: new Date(),
      connections: count
    });

    if (this.metrics.database.length > 100) {
      this.metrics.database.shift();
    }
  }

  /**
   * Record memory usage
   */
  recordMemory() {
    const usage = process.memoryUsage();
    this.currentMetrics.memoryUsage = Math.round(usage.heapUsed / 1024 / 1024); // MB

    this.metrics.memory.push({
      timestamp: new Date(),
      heapUsed: this.currentMetrics.memoryUsage,
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024)
    });

    if (this.metrics.memory.length > 60) { // Keep 1 hour of 1-minute samples
      this.metrics.memory.shift();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    this.recordMemory();

    return {
      ...this.currentMetrics,
      uptime: Math.round((Date.now() - this.currentMetrics.uptime) / 1000), // seconds
      errorRate: this.currentMetrics.totalRequests > 0
        ? Math.round((this.currentMetrics.totalErrors / this.currentMetrics.totalRequests) * 100)
        : 0
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics();

    return {
      status: metrics.errorRate < 5 ? 'healthy' : 'degraded',
      metrics,
      checks: {
        avgResponseTime: {
          status: metrics.avgResponseTime < 1000 ? 'pass' : 'warn',
          value: `${metrics.avgResponseTime}ms`
        },
        errorRate: {
          status: metrics.errorRate < 5 ? 'pass' : 'warn',
          value: `${metrics.errorRate}%`
        },
        memory: {
          status: metrics.memoryUsage < 500 ? 'pass' : 'warn',
          value: `${metrics.memoryUsage}MB`
        },
        dbConnections: {
          status: metrics.dbConnections < 15 ? 'pass' : 'warn',
          value: metrics.dbConnections
        }
      }
    };
  }
}

/**
 * Alert System - Send alerts on critical events
 * Point 23: Alerts
 */
class AlertSystem {
  constructor() {
    this.alerts = [];
    this.alertThresholds = {
      errorRate: 5, // %
      avgResponseTime: 5000, // ms
      memoryUsage: 500, // MB
      errorCount: 10 // in 5 minutes
    };
    this.alertHandlers = [];
  }

  /**
   * Register alert handler (e.g., email, Slack, webhook)
   */
  registerHandler(handler) {
    this.alertHandlers.push(handler);
  }

  /**
   * Send alert
   */
  async sendAlert(severity, title, message, data = {}) {
    const alert = {
      id: `alert_${Date.now()}`,
      timestamp: new Date(),
      severity, // critical, warning, info
      title,
      message,
      data,
      sent: false
    };

    this.alerts.push(alert);

    // Log alert
    logger.warn(`ALERT [${severity}]: ${title}`, {
      message,
      data
    });

    // Send to all handlers
    for (const handler of this.alertHandlers) {
      try {
        await handler(alert);
        alert.sent = true;
      } catch (error) {
        logger.error('Alert handler failed', { handler: handler.name, error: error.message });
      }
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    return alert;
  }

  /**
   * Check metrics and generate alerts
   */
  async checkMetrics(metrics, errorGroups) {
    // High error rate alert
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      await this.sendAlert('critical', 'High Error Rate',
        `Error rate is ${metrics.errorRate}%`,
        { errorRate: metrics.errorRate, threshold: this.alertThresholds.errorRate }
      );
    }

    // Slow response times alert
    if (metrics.avgResponseTime > this.alertThresholds.avgResponseTime) {
      await this.sendAlert('warning', 'Slow API Response',
        `Average response time is ${metrics.avgResponseTime}ms`,
        { avgTime: metrics.avgResponseTime, threshold: this.alertThresholds.avgResponseTime }
      );
    }

    // High memory usage alert
    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      await this.sendAlert('warning', 'High Memory Usage',
        `Memory usage is ${metrics.memoryUsage}MB`,
        { memory: metrics.memoryUsage, threshold: this.alertThresholds.memoryUsage }
      );
    }

    // Critical error frequency alert
    const recentErrors = errorGroups.filter(g =>
      (new Date() - g.lastOccurrence) < 5 * 60 * 1000 // Last 5 minutes
    );
    if (recentErrors.length > 0) {
      const totalCount = recentErrors.reduce((sum, g) => sum + g.count, 0);
      if (totalCount > this.alertThresholds.errorCount) {
        await this.sendAlert('critical', 'High Error Frequency',
          `${totalCount} errors in last 5 minutes`,
          { count: totalCount, threshold: this.alertThresholds.errorCount }
        );
      }
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 20) {
    return this.alerts.slice(-limit).reverse();
  }
}

/**
 * Console log alert handler
 */
const consoleAlertHandler = async (alert) => {
  const color = {
    critical: '\x1b[91m', // Bright red
    warning: '\x1b[93m',  // Bright yellow
    info: '\x1b[94m'      // Bright blue
  };

  const reset = '\x1b[0m';
  console.log(
    `${color[alert.severity]}[ALERT ${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}${reset}`
  );
};

/**
 * File alert handler
 */
const fileAlertHandler = async (alert) => {
  const alertFile = path.join(__dirname, '../logs/alerts.log');
  const content = `[${alert.timestamp.toISOString()}] [${alert.severity}] ${alert.title}: ${alert.message}\n`;
  fs.appendFileSync(alertFile, content);
};

// Export singletons
const errorTracker = new ErrorTracker();
const metricsCollector = new MetricsCollector();
const alertSystem = new AlertSystem();

// Register default handlers
alertSystem.registerHandler(consoleAlertHandler);
alertSystem.registerHandler(fileAlertHandler);

module.exports = {
  ErrorTracker,
  MetricsCollector,
  AlertSystem,
  errorTracker,
  metricsCollector,
  alertSystem,
  consoleAlertHandler,
  fileAlertHandler
};
