/**
 * Rate Limit Alert Middleware
 * Sends alerts when rate limits are exceeded
 */

const { logger } = require('../config/logger');

// Alert thresholds
const ALERT_THRESHOLD = 10; // Send alert after N violations
const ALERT_WINDOW = 60 * 60 * 1000; // 1 hour window

// Track violations
const violations = new Map();

function sendAlert(type, data) {
  // Log critical alert
  logger.error(JSON.stringify({
    type: 'rate_limit_alert',
    severity: 'CRITICAL',
    ...data,
    timestamp: new Date().toISOString()
  }));
  
  // TODO: Integrate with external monitoring
  // Examples:
  // - sendToDatadog(data);
  // - sendToNewRelic(data);
  // - sendToSlack(data);
  // - sendEmail(data);
  
  console.error(`🚨 ALERT: ${type} - IP ${data.ip} exceeded rate limit ${data.count} times`);
}

function trackViolation(ip, url) {
  const key = `${ip}:${url}`;
  const now = Date.now();
  
  if (!violations.has(key)) {
    violations.set(key, []);
  }
  
  const ipViolations = violations.get(key);
  
  // Remove old violations outside window
  const recentViolations = ipViolations.filter(time => now - time < ALERT_WINDOW);
  recentViolations.push(now);
  violations.set(key, recentViolations);
  
  // Send alert if threshold exceeded
  if (recentViolations.length >= ALERT_THRESHOLD) {
    sendAlert('rate_limit_exceeded', {
      ip,
      url,
      count: recentViolations.length,
      window: '1 hour'
    });
    
    // Reset to prevent spam
    violations.set(key, []);
  }
}

module.exports = { trackViolation };
