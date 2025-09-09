# Instagram Messaging Compliance Guide

## Overview

This guide covers compliance requirements for Instagram Direct Messaging using the **Instagram API with Facebook Login** approach. Following these guidelines is essential for maintaining API access and avoiding account restrictions.

## Instagram/Facebook Messaging Policies

### 1. 24-Hour Messaging Window

**Rule**: You can send messages freely for 24 hours after a user messages you.

**Implementation**:
```typescript
const canSendMessage = (lastUserMessageTime: number): boolean => {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const timeSinceLastMessage = Date.now() - lastUserMessageTime;
  
  return timeSinceLastMessage <= twentyFourHours;
};

// Before sending any message
if (!canSendMessage(conversation.last_user_message_time)) {
  // Must use message tags or wait for user to message again
  showWarning('Cannot send message - 24 hour window expired');
  return;
}
```

**Outside 24-Hour Window - Message Tags**:
```typescript
// Allowed message tags for messages outside 24-hour window
const allowedTags = [
  'CONFIRMED_EVENT_UPDATE',     // Event reminders
  'POST_PURCHASE_UPDATE',       // Order/shipping updates  
  'ACCOUNT_UPDATE',             // Account changes
  'HUMAN_AGENT'                 // Transfer to human agent
];

const sendTaggedMessage = async (recipientId: string, text: string, tag: string) => {
  if (!allowedTags.includes(tag)) {
    throw new Error(`Invalid message tag: ${tag}`);
  }
  
  return await instagramApiService.sendTextMessage(recipientId, text, 'MESSAGE_TAG', tag);
};

// Example usage
await sendTaggedMessage(
  userId, 
  'Your order #12345 has shipped and will arrive tomorrow!',
  'POST_PURCHASE_UPDATE'
);
```

### 2. User Consent Requirements

**Rule**: Users must initiate conversation or explicitly opt-in.

**Valid Consent**:
- User sends a message to your account
- User responds to your Instagram story
- User clicks a message button or quick reply
- User uses Instagram's "Message" button on your profile

**Invalid Consent**:
- Following your account
- Liking your posts  
- Commenting on your posts
- Being tagged in posts

```typescript
const validateUserConsent = (conversation: InstagramConversation): boolean => {
  // Check if user initiated the conversation
  if (conversation.messages.length === 0) return false;
  
  const firstMessage = conversation.messages[0];
  
  // Verify first message was from user (not business)
  return firstMessage.from === 'user';
};
```

### 3. Opt-Out Handling

**Rule**: Users must be able to stop receiving messages.

**Implementation**:
```typescript
const handleOptOut = async (recipientId: string, message: string) => {
  const optOutKeywords = ['stop', 'unsubscribe', 'opt out', 'remove me'];
  
  if (optOutKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
    // Mark user as opted out
    await markUserOptedOut(recipientId);
    
    // Send confirmation
    await instagramApiService.sendTextMessage(
      recipientId,
      'You have been unsubscribed from automated messages. You can still message us anytime for support.'
    );
    
    // Disable auto-replies for this user
    await disableAutoRepliesForUser(recipientId);
    
    return true;
  }
  
  return false;
};
```

### 4. Content Restrictions

**Prohibited Content**:
- Spam or unsolicited promotional content
- Adult content
- Illegal products or services
- Misleading information
- Content violating Instagram Community Guidelines

**Content Validation**:
```typescript
const validateMessageContent = (content: string): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check for spam indicators
  const spamIndicators = [
    /\b(free|act now|limited time|click here)\b/gi,
    /[A-Z]{10,}/, // Excessive caps
    /!{3,}/, // Multiple exclamation marks
    /\$\d+.*\$\d+.*\$\d+/ // Multiple price mentions
  ];
  
  spamIndicators.forEach(pattern => {
    if (pattern.test(content)) {
      issues.push('Content may be flagged as spam');
    }
  });
  
  // Check message length
  if (content.length > 2000) {
    issues.push('Message too long - may be truncated');
  }
  
  // Check for promotional content without user request
  const promoKeywords = ['sale', 'discount', 'offer', 'deal', 'promotion'];
  if (promoKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
    issues.push('Promotional content - ensure user requested this information');
  }
  
  return { valid: issues.length === 0, issues };
};
```

## GDPR & Privacy Compliance

### Data Collection Notice

```typescript
const privacyNotice = {
  first_message_response: `
Thanks for messaging us! 

By continuing this conversation, you agree to our privacy policy. 
We'll use your Instagram info to provide support and may store our conversation for quality purposes.

View privacy policy: https://yourstore.com/privacy
Opt out anytime: Reply "STOP"
  `.trim(),
  
  // Include in welcome auto-reply
  include_in_welcome: true
};
```

### Data Retention Policy

```typescript
const dataRetentionPolicy = {
  // Message retention periods
  message_retention_days: 365,
  inactive_conversation_days: 90,
  user_profile_retention_days: 1095, // 3 years
  
  // Data deletion
  deleteUserData: async (userId: string) => {
    // Delete conversation data
    await deleteConversation(userId);
    
    // Delete user profile cache
    await deleteUserProfile(userId);
    
    // Delete auto-reply history
    await deleteAutoReplyHistory(userId);
    
    // Log deletion for compliance
    logDataDeletion(userId, 'user_request');
  },
  
  // Auto-cleanup old data
  scheduleCleanup: () => {
    setInterval(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dataRetentionPolicy.message_retention_days);
      
      await cleanupOldMessages(cutoffDate);
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }
};
```

### User Rights (GDPR)

```typescript
const handleUserDataRequest = async (userId: string, requestType: 'access' | 'delete' | 'portability') => {
  switch (requestType) {
    case 'access':
      // Provide all stored data about user
      const userData = await getUserData(userId);
      return {
        conversations: userData.conversations,
        profile_data: userData.profile,
        auto_reply_history: userData.autoReplies,
        preferences: userData.preferences
      };
      
    case 'delete':
      // Delete all user data
      await dataRetentionPolicy.deleteUserData(userId);
      return { deleted: true, timestamp: new Date().toISOString() };
      
    case 'portability':
      // Export data in portable format
      return await exportUserDataPortable(userId);
  }
};
```

## Message Frequency Limits

### Anti-Spam Measures

```typescript
const messageFrequencyLimits = {
  max_messages_per_hour: 10,
  max_messages_per_day: 50,
  cooldown_after_no_response: 6 * 60 * 60 * 1000, // 6 hours
  
  checkFrequencyLimit: (userId: string): boolean => {
    const userMessageHistory = getRecentMessages(userId);
    const lastHour = userMessageHistory.filter(
      msg => Date.now() - msg.timestamp < 60 * 60 * 1000
    );
    
    if (lastHour.length >= messageFrequencyLimits.max_messages_per_hour) {
      logFrequencyLimitHit(userId, 'hourly');
      return false;
    }
    
    const lastDay = userMessageHistory.filter(
      msg => Date.now() - msg.timestamp < 24 * 60 * 60 * 1000
    );
    
    if (lastDay.length >= messageFrequencyLimits.max_messages_per_day) {
      logFrequencyLimitHit(userId, 'daily');
      return false;
    }
    
    return true;
  }
};
```

### Engagement Quality Scoring

```typescript
const engagementScoring = {
  calculateScore: (conversation: InstagramConversation): number => {
    const messages = conversation.messages;
    if (messages.length === 0) return 0;
    
    let score = 0;
    
    // Response rate (user responds to our messages)
    const businessMessages = messages.filter(m => m.from === 'business');
    const userResponses = messages.filter((m, i) => 
      m.from === 'user' && i > 0 && messages[i-1].from === 'business'
    );
    
    const responseRate = businessMessages.length > 0 ? userResponses.length / businessMessages.length : 0;
    score += responseRate * 40; // 40 points max
    
    // Conversation length
    const conversationLength = Math.min(messages.length / 10, 1);
    score += conversationLength * 20; // 20 points max
    
    // Recent activity
    const lastMessageAge = Date.now() - conversation.last_message_time;
    const recencyScore = Math.max(0, 1 - (lastMessageAge / (7 * 24 * 60 * 60 * 1000))); // 1 week
    score += recencyScore * 20; // 20 points max
    
    // User initiated
    if (messages[0].from === 'user') {
      score += 20; // 20 points bonus
    }
    
    return Math.min(score, 100);
  },
  
  // Only send marketing to highly engaged users
  canSendMarketing: (conversation: InstagramConversation): boolean => {
    return engagementScoring.calculateScore(conversation) > 70;
  }
};
```

## Content Moderation

### Automated Content Scanning

```typescript
const contentModeration = {
  scanOutgoingMessage: (content: string): { approved: boolean; flags: string[] } => {
    const flags: string[] = [];
    
    // Check for policy violations
    const prohibitedPatterns = [
      /\b(buy now|urgent|limited time|act fast)\b/gi, // Aggressive sales
      /(click here|visit now)/gi, // Potential spam
      /\b(guaranteed|promise|100%)\b/gi // Misleading claims
    ];
    
    prohibitedPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        flags.push(`Policy violation pattern ${index + 1}`);
      }
    });
    
    // Check URL safety
    const urls = content.match(/https?:\/\/[^\s]+/g);
    if (urls) {
      urls.forEach(url => {
        if (!isSafeUrl(url)) {
          flags.push(`Unsafe URL detected: ${url}`);
        }
      });
    }
    
    return { approved: flags.length === 0, flags };
  },
  
  isSafeUrl: (url: string): boolean => {
    // Check against safe domain list
    const safeDomains = ['yourstore.com', 'yourdomain.com'];
    try {
      const domain = new URL(url).hostname;
      return safeDomains.some(safe => domain.endsWith(safe));
    } catch {
      return false;
    }
  }
};
```

## Audit Trail & Compliance Logging

### Message Logging

```typescript
interface ComplianceLog {
  message_id: string;
  conversation_id: string;
  sender: 'business' | 'user';
  content_type: 'text' | 'template' | 'quick_reply';
  timestamp: string;
  within_24h_window: boolean;
  message_tag?: string;
  user_consent_verified: boolean;
  auto_reply: boolean;
  compliance_flags: string[];
}

const logMessageForCompliance = async (
  messageData: any, 
  conversation: InstagramConversation
): Promise<void> => {
  const log: ComplianceLog = {
    message_id: messageData.message_id,
    conversation_id: conversation.id,
    sender: 'business',
    content_type: messageData.type,
    timestamp: new Date().toISOString(),
    within_24h_window: canSendMessage(conversation.last_user_message_time),
    message_tag: messageData.tag,
    user_consent_verified: validateUserConsent(conversation),
    auto_reply: messageData.auto_reply || false,
    compliance_flags: []
  };
  
  // Store compliance log
  await storeComplianceLog(log);
};
```

### Regular Compliance Audits

```typescript
const complianceAudit = {
  runMonthlyAudit: async () => {
    const auditResults = {
      total_messages_sent: 0,
      messages_within_window: 0,
      messages_with_tags: 0,
      opt_out_requests: 0,
      policy_violations: 0,
      user_complaints: 0
    };
    
    // Analyze last 30 days of messages
    const logs = await getComplianceLogs(30);
    
    logs.forEach(log => {
      auditResults.total_messages_sent++;
      
      if (log.within_24h_window) {
        auditResults.messages_within_window++;
      }
      
      if (log.message_tag) {
        auditResults.messages_with_tags++;
      }
      
      if (log.compliance_flags.length > 0) {
        auditResults.policy_violations++;
      }
    });
    
    // Generate compliance report
    return generateComplianceReport(auditResults);
  }
};
```

## User Consent Management

### Tracking Consent

```typescript
interface UserConsent {
  user_id: string;
  instagram_username: string;
  consent_type: 'message_initiated' | 'button_click' | 'story_reply';
  consent_timestamp: string;
  opt_out_timestamp?: string;
  marketing_consent: boolean;
  support_consent: boolean;
}

const consentManager = {
  recordConsent: async (userId: string, type: UserConsent['consent_type']) => {
    const consent: UserConsent = {
      user_id: userId,
      instagram_username: await getUserUsername(userId),
      consent_type: type,
      consent_timestamp: new Date().toISOString(),
      marketing_consent: type === 'message_initiated',
      support_consent: true
    };
    
    await storeUserConsent(consent);
  },
  
  hasValidConsent: async (userId: string): Promise<boolean> => {
    const consent = await getUserConsent(userId);
    return consent && !consent.opt_out_timestamp;
  },
  
  revokeConsent: async (userId: string) => {
    await updateUserConsent(userId, {
      opt_out_timestamp: new Date().toISOString(),
      marketing_consent: false
    });
  }
};
```

### Marketing vs Support Messages

```typescript
const messageClassification = {
  isMarketingMessage: (content: string): boolean => {
    const marketingKeywords = [
      'sale', 'discount', 'offer', 'promotion', 'deal',
      'new product', 'launch', 'announcement', 'limited time'
    ];
    
    return marketingKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  },
  
  canSendMarketing: async (userId: string): Promise<boolean> => {
    const consent = await getUserConsent(userId);
    return consent?.marketing_consent && !consent?.opt_out_timestamp;
  },
  
  // Always allow support messages (with proper consent)
  canSendSupport: async (userId: string): Promise<boolean> => {
    const consent = await getUserConsent(userId);
    return consent?.support_consent && !consent?.opt_out_timestamp;
  }
};

// Before sending any message
const sendComplianceCheckedMessage = async (userId: string, content: string) => {
  const isMarketing = messageClassification.isMarketingMessage(content);
  
  if (isMarketing && !(await messageClassification.canSendMarketing(userId))) {
    throw new Error('User has not consented to marketing messages');
  }
  
  if (!isMarketing && !(await messageClassification.canSendSupport(userId))) {
    throw new Error('User has opted out of all messages');
  }
  
  return await instagramApiService.sendTextMessage(userId, content);
};
```

## Data Protection Compliance

### Personal Data Handling

```typescript
const personalDataHandler = {
  // What counts as personal data from Instagram
  personalDataFields: [
    'user_id', 'username', 'name', 'profile_pic',
    'follower_count', 'email', 'phone'
  ],
  
  // Encrypt sensitive data
  encryptSensitiveData: (data: any): any => {
    const sensitiveFields = ['email', 'phone', 'real_name'];
    const encrypted = { ...data };
    
    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = encrypt(encrypted[field]);
      }
    });
    
    return encrypted;
  },
  
  // Anonymize data for analytics
  anonymizeForAnalytics: (conversation: InstagramConversation) => {
    return {
      conversation_id: hashUserId(conversation.id),
      message_count: conversation.messages.length,
      user_type: conversation.user.is_verified_user ? 'verified' : 'standard',
      follower_tier: categorizeFollowerCount(conversation.user.follower_count),
      response_times: conversation.messages.map(m => m.timestamp),
      // Remove all personally identifiable information
    };
  }
};
```

### Cross-Border Data Transfer

```typescript
const dataTransferCompliance = {
  // Check user location for GDPR applicability
  isEUUser: async (userId: string): Promise<boolean> => {
    try {
      // This would require additional API calls or IP geolocation
      const userLocation = await getUserLocation(userId);
      const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', /* ... */];
      return euCountries.includes(userLocation.country_code);
    } catch {
      // Assume EU for safety
      return true;
    }
  },
  
  // Apply stricter rules for EU users
  handleEUUser: async (userId: string) => {
    if (await dataTransferCompliance.isEUUser(userId)) {
      // Apply GDPR-specific consent flow
      await showGDPRConsentFlow(userId);
      
      // Enable additional privacy features
      await enablePrivacyMode(userId);
    }
  }
};
```

## Reporting & Transparency

### Transparency Report Generation

```typescript
const transparencyReport = {
  generateMonthlyReport: async () => {
    const report = {
      period: {
        start: getMonthStart(),
        end: getMonthEnd()
      },
      
      messaging_stats: {
        total_conversations: await getConversationCount(),
        total_messages_sent: await getMessagesSentCount(),
        auto_reply_percentage: await getAutoReplyPercentage(),
        human_agent_escalations: await getEscalationCount()
      },
      
      compliance_metrics: {
        messages_within_24h_window: await getWindow24hCompliance(),
        tagged_messages_sent: await getTaggedMessageCount(),
        opt_out_requests: await getOptOutCount(),
        consent_violations: await getConsentViolations(),
        content_policy_flags: await getContentPolicyFlags()
      },
      
      user_data_handling: {
        data_deletion_requests: await getDataDeletionRequests(),
        data_access_requests: await getDataAccessRequests(),
        privacy_policy_updates: await getPrivacyPolicyUpdates(),
        retention_policy_enforced: await verifyRetentionPolicyCompliance()
      }
    };
    
    return report;
  }
};
```

### User Complaint Handling

```typescript
const complaintHandler = {
  processComplaint: async (userId: string, complaint: string) => {
    const complaintRecord = {
      user_id: userId,
      complaint_text: complaint,
      timestamp: new Date().toISOString(),
      status: 'open',
      category: categorizeComplaint(complaint),
      requires_immediate_action: isUrgentComplaint(complaint)
    };
    
    // Store complaint
    await storeComplaint(complaintRecord);
    
    // Immediate response
    await instagramApiService.sendTextMessage(
      userId,
      'Thank you for your feedback. We take all concerns seriously and will review this within 24 hours. A team member will follow up with you directly.'
    );
    
    // Alert compliance team for urgent issues
    if (complaintRecord.requires_immediate_action) {
      await alertComplianceTeam(complaintRecord);
    }
  },
  
  categorizeComplaint: (text: string): string => {
    const categories = {
      privacy: ['privacy', 'data', 'personal', 'GDPR'],
      spam: ['spam', 'too many', 'stop', 'unsubscribe'],
      harassment: ['harassment', 'inappropriate', 'offensive'],
      technical: ['not working', 'error', 'bug', 'broken'],
      billing: ['charge', 'payment', 'refund', 'money']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
};
```

## API Access Compliance

### Token Management

```typescript
const tokenCompliance = {
  // Access tokens must be refreshed regularly
  tokenRefreshSchedule: 50 * 24 * 60 * 60 * 1000, // 50 days (before 60-day expiry)
  
  scheduleTokenRefresh: () => {
    setInterval(async () => {
      try {
        await refreshInstagramAccessToken();
        console.log('✅ Instagram access token refreshed');
      } catch (error) {
        console.error('❌ Failed to refresh access token:', error);
        // Alert admin
        await alertTokenRefreshFailure();
      }
    }, tokenCompliance.tokenRefreshSchedule);
  },
  
  // Validate token permissions
  validateTokenPermissions: async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
      );
      const { data } = await response.json();
      
      const requiredPermissions = [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'pages_manage_metadata'
      ];
      
      const grantedPerms = data.filter((p: any) => p.status === 'granted').map((p: any) => p.permission);
      
      return requiredPermissions.every(perm => grantedPerms.includes(perm));
    } catch (error) {
      console.error('Error validating permissions:', error);
      return false;
    }
  }
};
```

## Compliance Checklist

### Pre-Launch Checklist

- [ ] **User Consent**: ✅ Only message users who initiated conversation
- [ ] **24-Hour Window**: ✅ Respect messaging window or use appropriate tags  
- [ ] **Opt-Out Mechanism**: ✅ Handle "STOP" and unsubscribe requests
- [ ] **Content Policy**: ✅ No spam, misleading, or prohibited content
- [ ] **Privacy Policy**: ✅ Clear privacy policy linked and accessible
- [ ] **Data Retention**: ✅ Defined data retention and deletion policies
- [ ] **Audit Logging**: ✅ Log all messaging activities for compliance
- [ ] **Token Security**: ✅ Secure token storage and refresh schedule

### Ongoing Compliance Monitoring

```typescript
const ongoingCompliance = {
  dailyChecks: [
    'Verify auto-reply consent compliance',
    'Check message frequency limits',
    'Review user opt-out requests',
    'Monitor content policy flags'
  ],
  
  weeklyChecks: [
    'Audit 24-hour window compliance', 
    'Review escalated conversations',
    'Check token expiry status',
    'Analyze user engagement scores'
  ],
  
  monthlyChecks: [
    'Generate transparency report',
    'Review data retention compliance',
    'Update privacy policy if needed',
    'Conduct security audit'
  ]
};
```

### Compliance Violation Response

```typescript
const violationResponse = {
  handlePolicyViolation: async (violation: { type: string; details: any }) => {
    switch (violation.type) {
      case 'messaging_window':
        // Stop sending messages outside window
        await pauseMessagingForUser(violation.details.userId);
        break;
        
      case 'content_policy':
        // Review and modify auto-reply rules
        await reviewContentPolicyViolation(violation.details);
        break;
        
      case 'spam_complaint':
        // Immediate action required
        await handleSpamComplaint(violation.details);
        break;
        
      case 'data_request':
        // Handle GDPR/privacy requests
        await processDataRequest(violation.details);
        break;
    }
    
    // Log compliance action
    await logComplianceAction(violation);
  }
};
```

This comprehensive compliance guide ensures your Instagram DM feature operates within all platform policies and legal requirements for the Facebook Login approach. Following these guidelines will help maintain API access and protect user privacy.
