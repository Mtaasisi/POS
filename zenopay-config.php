<?php
/**
 * ZenoPay API Configuration
 * 
 * Configuration file for ZenoPay Mobile Money Tanzania API integration
 */

// Your ZenoPay API key
define('ZP_API_KEY', 'mzhU0r-QaBCW2h1JRsFbOFQ9iU2-Q_bDYty0HT0kZ_bzBys9Ub5HgWCTlYc5QwxkCJJMjVv1yzCLfO3SZQxSZg');

// Base URL for ZenoPay endpoints
define('ZP_BASE_URL', 'https://zenoapi.com/api/payments');

// Webhook URL (update with your actual webhook endpoint)
define('ZP_WEBHOOK_URL', 'https://your-domain.com/zenopay-webhook.php');

// Logging configuration
define('ZP_LOG_ENABLED', true);
define('ZP_LOG_DIR', __DIR__ . '/logs/');
define('ZP_ERROR_LOG', ZP_LOG_DIR . 'zenopay_errors.log');
define('ZP_WEBHOOK_LOG', ZP_LOG_DIR . 'zenopay_webhooks.log');

// Create logs directory if it doesn't exist
if (ZP_LOG_ENABLED && !is_dir(ZP_LOG_DIR)) {
    mkdir(ZP_LOG_DIR, 0755, true);
}

/**
 * Log error messages
 */
function zp_log_error($message) {
    if (ZP_LOG_ENABLED) {
        $timestamp = date('[Y-m-d H:i:s] ');
        file_put_contents(ZP_ERROR_LOG, $timestamp . $message . PHP_EOL, FILE_APPEND);
    }
}

/**
 * Log webhook payloads
 */
function zp_log_webhook($payload) {
    if (ZP_LOG_ENABLED) {
        $timestamp = date('[Y-m-d H:i:s] ');
        file_put_contents(ZP_WEBHOOK_LOG, $timestamp . $payload . PHP_EOL, FILE_APPEND);
    }
}
?>
