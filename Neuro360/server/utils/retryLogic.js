/**
 * Retry utility with exponential backoff
 * Point 10: Retry Logic
 */

const logger = require('../services/logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of function
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry = null
  } = options;

  let lastError;
  let delayMs = initialDelayMs;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        if (onRetry) {
          onRetry(attempt + 1, error, delayMs);
        }

        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries - 1}`, {
          error: error.message,
          delayMs
        });

        // Exponential backoff with jitter
        await new Promise(resolve => {
          const jitter = Math.random() * 0.1 * delayMs;
          setTimeout(resolve, delayMs + jitter);
        });

        delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
      }
    }
  }

  logger.error('All retry attempts failed', {
    attempts: maxRetries,
    lastError: lastError.message
  });

  throw lastError;
}

/**
 * Retry database queries
 */
async function retryDatabaseQuery(queryFn) {
  return retryWithBackoff(queryFn, {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000
  });
}

/**
 * Retry API calls
 */
async function retryApiCall(apiFn) {
  return retryWithBackoff(apiFn, {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000
  });
}

/**
 * Retry email sending
 */
async function retryEmailSend(emailFn) {
  return retryWithBackoff(emailFn, {
    maxRetries: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000
  });
}

/**
 * Retry file operations
 */
async function retryFileOperation(fileFn) {
  return retryWithBackoff(fileFn, {
    maxRetries: 2,
    initialDelayMs: 500,
    maxDelayMs: 5000
  });
}

module.exports = {
  retryWithBackoff,
  retryDatabaseQuery,
  retryApiCall,
  retryEmailSend,
  retryFileOperation
};
