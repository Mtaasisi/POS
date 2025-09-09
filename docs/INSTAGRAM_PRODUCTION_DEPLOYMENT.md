# Instagram DM Production Deployment Guide

## Overview

This guide covers deploying the Instagram DM feature to production using the **Instagram API with Facebook Login** approach. Follow these steps to ensure a secure, scalable, and compliant deployment.

## Pre-Deployment Checklist

### ✅ Facebook App Configuration

1. **App Review & Approval**
   ```bash
   # Required before going live
   - Submit app for Facebook review
   - Get approval for instagram_business_manage_messages permission
   - Provide detailed use case documentation
   - Complete app verification process
   ```

2. **Production App Settings**
   ```typescript
   const productionConfig = {
     app_id: process.env.FACEBOOK_APP_ID,
     app_secret: process.env.FACEBOOK_APP_SECRET,
     webhook_verify_token: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
     
     // Use production Instagram account
     instagram_account_id: process.env.PROD_INSTAGRAM_ACCOUNT_ID,
     facebook_page_id: process.env.PROD_FACEBOOK_PAGE_ID,
     
     // Production webhook URL
     webhook_url: 'https://yourdomain.com/webhook/instagram'
   };
   ```

3. **Required Permissions Verification**
   ```typescript
   const requiredPermissions = [
     'instagram_business_basic',           // Required
     'instagram_business_manage_messages', // Required  
     'pages_manage_metadata',             // Required
     'pages_messaging',                   // Required
     'business_management'                // Optional but recommended
   ];
   
   // Verify all permissions are granted
   const verifyPermissions = async () => {
     const response = await fetch(
       `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
     );
     const { data } = await response.json();
     
     const granted = data.filter(p => p.status === 'granted').map(p => p.permission);
     const missing = requiredPermissions.filter(p => !granted.includes(p));
     
     if (missing.length > 0) {
       throw new Error(`Missing permissions: ${missing.join(', ')}`);
     }
   };
   ```

### ✅ Infrastructure Requirements

#### Server Requirements

```yaml
# Minimum server specifications
cpu: 2 cores
memory: 4GB RAM
storage: 20GB SSD
network: 100Mbps

# Recommended for high volume
cpu: 4+ cores  
memory: 8GB+ RAM
storage: 50GB+ SSD
network: 1Gbps

# Load balancer for multiple instances
load_balancer: true
ssl_certificate: required
cdn: recommended
```

#### Database Setup

```sql
-- Production database tables for Instagram DM
CREATE TABLE instagram_conversations (
    id VARCHAR(255) PRIMARY KEY,
    instagram_user_id VARCHAR(255) NOT NULL,
    facebook_page_id VARCHAR(255) NOT NULL,
    status ENUM('active', 'archived', 'blocked') DEFAULT 'active',
    last_message_time TIMESTAMP,
    unread_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_instagram_user (instagram_user_id),
    INDEX idx_status (status),
    INDEX idx_last_message (last_message_time)
);

CREATE TABLE instagram_messages (
    id VARCHAR(255) PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    sender_type ENUM('user', 'business') NOT NULL,
    content_type ENUM('text', 'template', 'quick_reply', 'attachment') NOT NULL,
    content JSON,
    message_tag VARCHAR(100),
    is_auto_reply BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES instagram_conversations(id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_sender (sender_type)
);

CREATE TABLE instagram_user_profiles (
    instagram_user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    profile_pic_url TEXT,
    follower_count INT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_following_business BOOLEAN DEFAULT FALSE,
    is_followed_by_business BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_verified (is_verified)
);

CREATE TABLE instagram_compliance_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(255),
    user_id VARCHAR(255),
    action_type VARCHAR(100),
    within_24h_window BOOLEAN,
    message_tag VARCHAR(100),
    consent_verified BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_timestamp (timestamp),
    INDEX idx_user (user_id),
    INDEX idx_action (action_type)
);
```

### ✅ Environment Configuration

```bash
# Production environment variables
# Facebook/Instagram API
FACEBOOK_APP_ID=your_production_app_id
FACEBOOK_APP_SECRET=your_production_app_secret
INSTAGRAM_ACCESS_TOKEN=your_long_lived_production_token
INSTAGRAM_ACCOUNT_ID=your_production_instagram_account_id
FACEBOOK_PAGE_ID=your_production_facebook_page_id

# Webhook Security
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=secure_random_token_here
WEBHOOK_SECRET=another_secure_token_for_signature_verification

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/appdb
REDIS_URL=redis://prod-redis:6379

# Application
NODE_ENV=production
LOG_LEVEL=info
API_BASE_URL=https://yourdomain.com/api

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
NEW_RELIC_LICENSE_KEY=your_newrelic_key_here

# Security
ENCRYPTION_KEY=32_character_encryption_key_here
JWT_SECRET=jwt_secret_for_session_management
```

## Webhook Deployment

### Production Webhook Endpoint

```typescript
// Production webhook with full security and monitoring
import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Rate limiting for webhooks
const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/webhook', webhookRateLimit);

// Webhook signature verification middleware
const verifySignature = (req: any, res: any, next: any) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  
  if (!signature) {
    return res.status(403).send('Missing signature');
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET!)
    .update(payload, 'utf8')
    .digest('hex');
  
  if (signature !== `sha256=${expectedSignature}`) {
    console.error('❌ Invalid webhook signature');
    return res.status(403).send('Invalid signature');
  }
  
  next();
};

// Webhook endpoints
app.get('/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

app.post('/webhook/instagram', verifySignature, async (req, res) => {
  try {
    // Respond immediately to Facebook
    res.status(200).send('OK');
    
    // Process webhook asynchronously
    await processWebhookAsync(req.body);
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still return 200 to prevent Facebook retries
    res.status(200).send('OK');
  }
});

const processWebhookAsync = async (webhookData: any) => {
  // Use queue for processing to handle high volume
  await messageQueue.add('process_instagram_webhook', webhookData, {
    attempts: 3,
    backoff: 'exponential',
    delay: 1000
  });
};
```

### Webhook Scaling

```typescript
// Use message queue for high-volume webhook processing
import Bull from 'bull';

const messageQueue = new Bull('Instagram Message Processing', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: 'exponential'
  }
});

messageQueue.process('process_instagram_webhook', async (job) => {
  const webhookData = job.data;
  
  try {
    await processInstagramWebhook(webhookData);
    
    // Update metrics
    await updateWebhookMetrics('success');
    
  } catch (error) {
    console.error('Queue processing error:', error);
    await updateWebhookMetrics('failure');
    throw error;
  }
});

// Monitor queue health
messageQueue.on('completed', (job) => {
  console.log(`✅ Webhook processed: ${job.id}`);
});

messageQueue.on('failed', (job, error) => {
  console.error(`❌ Webhook failed: ${job.id}`, error);
});
```

## Database Optimization

### Performance Optimization

```sql
-- Indexes for optimal query performance
CREATE INDEX idx_conversations_user_status ON instagram_conversations(instagram_user_id, status);
CREATE INDEX idx_messages_conversation_timestamp ON instagram_messages(conversation_id, timestamp DESC);
CREATE INDEX idx_compliance_logs_date ON instagram_compliance_logs(DATE(timestamp));

-- Partitioning for large datasets
ALTER TABLE instagram_messages 
PARTITION BY RANGE (UNIX_TIMESTAMP(timestamp)) (
    PARTITION p202401 VALUES LESS THAN (UNIX_TIMESTAMP('2024-02-01')),
    PARTITION p202402 VALUES LESS THAN (UNIX_TIMESTAMP('2024-03-01')),
    PARTITION p202403 VALUES LESS THAN (UNIX_TIMESTAMP('2024-04-01'))
    -- Add partitions as needed
);
```

### Data Archival

```typescript
const dataArchival = {
  // Archive old conversations
  archiveOldConversations: async () => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months old
    
    const query = `
      UPDATE instagram_conversations 
      SET status = 'archived' 
      WHERE last_message_time < ? 
      AND status = 'active'
      AND unread_count = 0
    `;
    
    await database.execute(query, [cutoffDate]);
  },
  
  // Move old messages to cold storage
  coldStorageArchival: async () => {
    const cutoffDate = new Date();
    cutoffDate.setYear(cutoffDate.getFullYear() - 1); // 1 year old
    
    // Export to cold storage (S3, Google Cloud Storage, etc.)
    const oldMessages = await getMessagesOlderThan(cutoffDate);
    await exportToColdStorage(oldMessages);
    
    // Remove from active database
    await deleteMessagesOlderThan(cutoffDate);
  }
};
```

## Monitoring & Alerting

### Production Monitoring

```typescript
const productionMonitoring = {
  // Key metrics to track
  metrics: {
    messages_per_minute: 0,
    webhook_response_time_ms: 0,
    api_success_rate: 0,
    error_rate: 0,
    queue_depth: 0,
    active_conversations: 0
  },
  
  // Alerting thresholds
  alerts: {
    high_error_rate: 0.05,        // 5% error rate
    slow_webhook_response: 5000,   // 5 second response time
    queue_backup: 100,             // 100+ items in queue
    api_failure_rate: 0.10         // 10% API failure rate
  },
  
  checkThresholds: () => {
    const { metrics, alerts } = productionMonitoring;
    
    if (metrics.error_rate > alerts.high_error_rate) {
      sendAlert('High error rate detected', metrics.error_rate);
    }
    
    if (metrics.webhook_response_time_ms > alerts.slow_webhook_response) {
      sendAlert('Slow webhook response', metrics.webhook_response_time_ms);
    }
    
    if (metrics.queue_depth > alerts.queue_backup) {
      sendAlert('Message queue backing up', metrics.queue_depth);
    }
  }
};

// Real-time monitoring dashboard
const monitoringDashboard = {
  realTimeMetrics: {
    uptime: '99.9%',
    messages_today: 1250,
    avg_response_time: '1.2s',
    active_conversations: 45,
    error_rate_24h: '0.02%'
  },
  
  alerts: [
    {
      level: 'warning',
      message: 'Instagram API rate limit at 80%',
      timestamp: new Date().toISOString()
    }
  ]
};
```

### Log Management

```typescript
// Structured logging for production
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console for development
    new winston.transports.Console(),
    
    // File for production
    new winston.transports.File({ 
      filename: 'logs/instagram-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/instagram-combined.log' 
    })
  ]
});

// Usage throughout the application
logger.info('Instagram message sent', {
  recipient_id: recipientId,
  message_type: 'text',
  response_time_ms: 250,
  success: true
});

logger.error('Instagram API error', {
  error_code: error.code,
  error_message: error.message,
  user_id: userId,
  operation: 'send_message',
  trace_id: error.fbtrace_id
});
```

## Security Configuration

### Token Security

```typescript
// Production token management
class ProductionTokenManager {
  private static encryptionKey = process.env.ENCRYPTION_KEY!;
  
  // Encrypt tokens before storage
  static encryptToken(token: string): string {
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  // Decrypt tokens for use
  static decryptToken(encryptedToken: string): string {
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  // Automatic token refresh
  static async refreshToken(): Promise<string> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${process.env.FACEBOOK_APP_ID}&` +
        `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
        `fb_exchange_token=${getCurrentToken()}`
      );
      
      const data = await response.json();
      
      if (data.access_token) {
        // Store new token securely
        await storeEncryptedToken(data.access_token);
        return data.access_token;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      throw error;
    }
  }
}
```

### API Security

```typescript
// Production API security measures
const apiSecurity = {
  // Rate limiting per user
  userRateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each user to 100 requests per windowMs
    keyGenerator: (req) => req.headers['x-user-id'] || req.ip,
    message: 'Too many requests from this user'
  }),
  
  // Input validation
  validateInput: (req: any, res: any, next: any) => {
    const { recipient_id, message } = req.body;
    
    if (!recipient_id || typeof recipient_id !== 'string') {
      return res.status(400).json({ error: 'Invalid recipient_id' });
    }
    
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: 'Invalid message content' });
    }
    
    // Sanitize input
    req.body.message = message.trim().substring(0, 2000);
    next();
  },
  
  // CORS configuration
  corsOptions: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
    credentials: true
  }
};
```

## Performance Optimization

### Caching Strategy

```typescript
// Redis caching for frequently accessed data
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const cacheManager = {
  // Cache user profiles (they change infrequently)
  cacheUserProfile: async (userId: string, profile: any) => {
    await redis.setex(
      `instagram_profile:${userId}`, 
      3600, // 1 hour TTL
      JSON.stringify(profile)
    );
  },
  
  getUserProfile: async (userId: string): Promise<any | null> => {
    const cached = await redis.get(`instagram_profile:${userId}`);
    return cached ? JSON.parse(cached) : null;
  },
  
  // Cache conversation summaries
  cacheConversationSummary: async (conversationId: string, summary: any) => {
    await redis.setex(
      `instagram_conversation:${conversationId}`,
      1800, // 30 minutes TTL
      JSON.stringify(summary)
    );
  },
  
  // Cache API responses
  cacheApiResponse: async (key: string, data: any, ttl: number = 300) => {
    await redis.setex(`instagram_api:${key}`, ttl, JSON.stringify(data));
  }
};
```

### Message Queue Optimization

```typescript
// Optimized queue processing for high volume
const optimizedQueue = {
  // Separate queues by priority
  priorities: {
    urgent: new Bull('Instagram Urgent', { redis: redisConfig }),
    normal: new Bull('Instagram Normal', { redis: redisConfig }),
    low: new Bull('Instagram Low', { redis: redisConfig })
  },
  
  // Process messages by priority
  addMessage: async (priority: 'urgent' | 'normal' | 'low', data: any) => {
    const options = {
      urgent: { priority: 10, delay: 0 },
      normal: { priority: 5, delay: 1000 },
      low: { priority: 1, delay: 5000 }
    };
    
    await optimizedQueue.priorities[priority].add(
      'process_message', 
      data, 
      options[priority]
    );
  },
  
  // Batch processing for efficiency
  processBatch: async (messages: any[]) => {
    const batches = chunk(messages, 10); // Process 10 at a time
    
    for (const batch of batches) {
      await Promise.all(batch.map(processMessage));
      await sleep(100); // Small delay between batches
    }
  }
};
```

## Load Testing

### Webhook Load Testing

```bash
# Use Apache Bench for webhook load testing
ab -n 1000 -c 10 -p webhook_payload.json -T application/json \
   https://yourdomain.com/webhook/instagram

# Or use artillery for more sophisticated testing
artillery quick --count 100 --num 10 \
  https://yourdomain.com/webhook/instagram
```

### API Load Testing

```typescript
// Load test Instagram API integration
const loadTest = {
  simulateHighVolume: async () => {
    const testUsers = generateTestUsers(100);
    const concurrent = 10;
    
    for (let i = 0; i < testUsers.length; i += concurrent) {
      const batch = testUsers.slice(i, i + concurrent);
      
      await Promise.all(batch.map(async (user) => {
        try {
          await instagramApiService.sendTextMessage(
            user.id, 
            'Load test message'
          );
        } catch (error) {
          console.error(`Load test failed for user ${user.id}:`, error);
        }
      }));
      
      // Respect rate limits
      await sleep(1000);
    }
  },
  
  measurePerformance: async () => {
    const startTime = Date.now();
    const operations = 100;
    
    for (let i = 0; i < operations; i++) {
      await performTestOperation();
    }
    
    const totalTime = Date.now() - startTime;
    const avgTimePerOp = totalTime / operations;
    
    console.log(`Performance: ${avgTimePerOp}ms per operation`);
    return avgTimePerOp;
  }
};
```

## Deployment Scripts

### Automated Deployment

```bash
#!/bin/bash
# deploy-instagram-dm.sh

set -e

echo "🚀 Deploying Instagram DM feature..."

# Environment checks
if [ -z "$FACEBOOK_APP_ID" ]; then
  echo "❌ FACEBOOK_APP_ID not set"
  exit 1
fi

if [ -z "$INSTAGRAM_ACCESS_TOKEN" ]; then
  echo "❌ INSTAGRAM_ACCESS_TOKEN not set"
  exit 1
fi

# Database migrations
echo "📊 Running database migrations..."
npm run migrate:instagram

# Build application
echo "🔨 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test:instagram

# Deploy to production
echo "🌐 Deploying to production..."
npm run deploy:prod

# Verify deployment
echo "✅ Verifying deployment..."
curl -f https://yourdomain.com/health/instagram || exit 1

# Webhook verification
echo "🔗 Testing webhook..."
curl -f "https://yourdomain.com/webhook/instagram?hub.mode=subscribe&hub.verify_token=$INSTAGRAM_WEBHOOK_VERIFY_TOKEN&hub.challenge=test" || exit 1

echo "✅ Instagram DM deployment complete!"
```

### Rollback Plan

```bash
#!/bin/bash
# rollback-instagram-dm.sh

echo "⏪ Rolling back Instagram DM feature..."

# Stop processing new webhooks
kubectl scale deployment webhook-processor --replicas=0

# Switch to previous version
kubectl rollout undo deployment/app-server

# Restore database if needed
if [ "$RESTORE_DB" = "true" ]; then
  echo "📊 Restoring database..."
  mysql -u$DB_USER -p$DB_PASS $DB_NAME < backup_pre_instagram_deploy.sql
fi

# Verify rollback
curl -f https://yourdomain.com/health || exit 1

echo "✅ Rollback complete"
```

## Go-Live Process

### Phase 1: Soft Launch (Days 1-7)

```typescript
const softLaunch = {
  // Enable for limited users first
  enabledUsers: [
    'internal_team_members',
    'beta_testers', 
    'selected_customers'
  ],
  
  // Feature flags
  features: {
    auto_reply: false,      // Start with manual replies only
    templates: true,        // Allow message templates
    quick_replies: true,    // Enable quick replies
    analytics: true         // Monitor everything
  },
  
  // Monitoring during soft launch
  monitoring: {
    alert_on_any_error: true,
    log_all_interactions: true,
    daily_performance_reports: true
  }
};
```

### Phase 2: Gradual Rollout (Days 8-14)

```typescript
const gradualRollout = {
  // Increase user base gradually
  rollout_percentage: 25, // 25% of users
  
  // Enable more features
  features: {
    auto_reply: true,       // Enable auto-replies
    business_hours: true,   // Enable business hours
    escalation: true        // Enable human agent escalation
  },
  
  // Performance validation
  success_criteria: {
    error_rate: '< 1%',
    response_time: '< 2s',
    user_satisfaction: '> 4.0/5'
  }
};
```

### Phase 3: Full Launch (Day 15+)

```typescript
const fullLaunch = {
  // All users enabled
  rollout_percentage: 100,
  
  // All features enabled
  features: {
    auto_reply: true,
    templates: true,
    analytics: true,
    advanced_features: true
  },
  
  // Standard monitoring
  monitoring: {
    error_alerting: true,
    performance_tracking: true,
    compliance_monitoring: true
  }
};
```

## Backup & Disaster Recovery

### Data Backup Strategy

```typescript
const backupStrategy = {
  // Daily incremental backups
  dailyBackup: async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Backup conversations
    await exportData(
      'instagram_conversations',
      `backups/instagram_conversations_${timestamp}.sql`
    );
    
    // Backup messages
    await exportData(
      'instagram_messages', 
      `backups/instagram_messages_${timestamp}.sql`
    );
    
    // Backup compliance logs
    await exportData(
      'instagram_compliance_logs',
      `backups/instagram_compliance_${timestamp}.sql`
    );
  },
  
  // Weekly full backups
  weeklyBackup: async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Full database backup
    await fullDatabaseBackup(`backups/full_backup_${timestamp}.sql`);
    
    // Configuration backup
    await backupConfiguration(`backups/config_${timestamp}.json`);
  }
};
```

### Disaster Recovery Plan

```typescript
const disasterRecovery = {
  // Recovery Time Objective (RTO): 15 minutes
  // Recovery Point Objective (RPO): 1 hour
  
  steps: [
    '1. Detect service disruption',
    '2. Switch to backup infrastructure', 
    '3. Restore data from latest backup',
    '4. Verify service functionality',
    '5. Update DNS/load balancer',
    '6. Monitor for stability'
  ],
  
  automatedFailover: async () => {
    // Switch to backup server
    await updateLoadBalancerConfig({
      primary: 'backup-server.yourdomain.com',
      health_check: '/health/instagram'
    });
    
    // Restore latest data
    await restoreFromBackup('latest');
    
    // Verify functionality
    const healthCheck = await performHealthCheck();
    if (!healthCheck.healthy) {
      throw new Error('Backup server not healthy');
    }
    
    // Notify team
    await sendAlert('Disaster recovery activated - service restored');
  }
};
```

## Compliance Auditing

### Automated Compliance Checks

```typescript
const complianceAuditing = {
  runDailyAudit: async () => {
    const auditResults = {
      messaging_window_compliance: await checkMessagingWindowCompliance(),
      consent_verification: await verifyUserConsent(),
      opt_out_handling: await auditOptOutHandling(),
      data_retention: await checkDataRetention(),
      token_security: await auditTokenSecurity()
    };
    
    // Generate compliance report
    const report = await generateComplianceReport(auditResults);
    
    // Alert if issues found
    const issues = Object.values(auditResults).filter(result => !result.compliant);
    if (issues.length > 0) {
      await alertComplianceTeam(report);
    }
    
    return report;
  },
  
  // Monthly compliance report for legal team
  generateMonthlyReport: async () => {
    return {
      period: getCurrentMonth(),
      total_conversations: await getConversationCount(),
      messages_sent: await getMessagesSentCount(),
      consent_rate: await getConsentRate(),
      opt_out_rate: await getOptOutRate(),
      policy_violations: await getPolicyViolations(),
      data_requests_processed: await getDataRequestCount(),
      recommendations: await getComplianceRecommendations()
    };
  }
};
```

## Production Checklist

### ✅ Pre-Launch Validation

- [ ] **Facebook App Review**: ✅ Approved for production use
- [ ] **Webhook Security**: ✅ Signature verification enabled
- [ ] **Rate Limiting**: ✅ Implemented and tested
- [ ] **Error Handling**: ✅ Graceful degradation paths
- [ ] **Monitoring**: ✅ Alerts and dashboards configured
- [ ] **Compliance**: ✅ All policies implemented
- [ ] **Performance**: ✅ Load tested and optimized
- [ ] **Security**: ✅ Tokens encrypted, HTTPS enabled
- [ ] **Backup**: ✅ Automated backup and recovery tested

### ✅ Day 1 Operations

- [ ] Monitor error rates continuously
- [ ] Verify webhook processing working
- [ ] Check API rate limit usage
- [ ] Monitor user engagement metrics
- [ ] Review compliance logs
- [ ] Test emergency procedures

### ✅ Ongoing Maintenance

- [ ] **Weekly**: Performance review and optimization
- [ ] **Monthly**: Compliance audit and reporting
- [ ] **Quarterly**: Security review and token rotation
- [ ] **Annually**: Full disaster recovery test

This production deployment guide ensures your Instagram DM feature launches successfully with proper security, monitoring, and compliance measures in place.
