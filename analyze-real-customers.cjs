const fs = require('fs');

class RealCustomerAnalyzer {
  constructor() {
    this.customers = new Map();
    this.messageData = [];
    this.promotionTargets = {
      activeCustomers: [],
      businessCustomers: [],
      personalCustomers: [],
      newCustomers: [],
      loyalCustomers: []
    };
  }

  // Parse CSV and extract real customer data
  parseMessageData(csvFilePath) {
    try {
      console.log('📊 Parsing real customer conversations...');
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      console.log(`📋 Found ${lines.length - 1} total messages`);
      
      let realCustomerMessages = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;
        
        const message = {};
        headers.forEach((header, index) => {
          message[header.trim()] = values[index]?.trim() || '';
        });
        
        // Filter for real customer conversations
        if (this.isRealCustomerMessage(message)) {
          this.messageData.push(message);
          this.processMessage(message);
          realCustomerMessages++;
        }
      }
      
      console.log(`✅ Processed ${realCustomerMessages} real customer messages`);
      console.log(`👥 Identified ${this.customers.size} unique real customers`);
      
    } catch (error) {
      console.error('❌ Error parsing CSV:', error.message);
    }
  }

  // Check if message is from a real customer (not service notifications)
  isRealCustomerMessage(message) {
    const senderId = message['Sender ID'] || '';
    const senderName = message['Sender Name'] || '';
    const text = message.Text || '';
    const service = message.Service || '';
    
    // Skip service notifications
    const serviceNames = [
      'CRDB BANK', 'crdb bank', 'crdbbank', 'Vodacom', 'tigopesa', 'm-pesa', 'M-PESA', 
      'M-Pesa Card', 'du.', 'EQUITYBANK', 'MIXX BY YAS', 'WhatsApp', 'iMessage'
    ];
    
    if (serviceNames.some(service => 
      senderId.toLowerCase().includes(service.toLowerCase()) ||
      senderName.toLowerCase().includes(service.toLowerCase())
    )) {
      return false;
    }
    
    // Look for phone numbers in sender ID (real customers)
    const phoneRegex = /[0-9]{9,}/;
    if (phoneRegex.test(senderId)) {
      return true;
    }
    
    // Look for personal names in sender name
    if (senderName && !serviceNames.some(service => 
      senderName.toLowerCase().includes(service.toLowerCase())
    )) {
      return true;
    }
    
    // Look for personal conversation patterns
    const personalPatterns = [
      /mambo|vipi|habari|asante|sawa|kaka|boss|mkuu/i,
      /niko|niko|nakuja|nakufata/i,
      /gari|simu|charge|network/i,
      /laki|pesa|malipo/i
    ];
    
    if (personalPatterns.some(pattern => pattern.test(text))) {
      return true;
    }
    
    return false;
  }

  // Parse CSV line handling commas in quoted fields
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  // Process individual message and extract customer info
  processMessage(message) {
    const phoneNumber = this.extractPhoneNumber(message);
    if (!phoneNumber) return;
    
    const customerId = this.normalizePhoneNumber(phoneNumber);
    
    if (!this.customers.has(customerId)) {
      this.customers.set(customerId, {
        id: customerId,
        phone: phoneNumber,
        name: this.extractCustomerName(message),
        messages: [],
        totalSpent: 0,
        lastActivity: null,
        firstActivity: null,
        messageCount: 0,
        incomingCount: 0,
        outgoingCount: 0,
        serviceTypes: new Set(),
        complaintCount: 0,
        purchaseCount: 0,
        paymentMethods: new Set(),
        locations: new Set(),
        languages: new Set(),
        responseTime: [],
        engagementScore: 0,
        loyaltyScore: 0,
        customerType: 'unknown',
        businessIndicators: new Set(),
        personalIndicators: new Set()
      });
    }
    
    const customer = this.customers.get(customerId);
    customer.messages.push(message);
    customer.messageCount++;
    
    // Update activity dates
    const messageDate = new Date(message['Message Date']);
    if (!customer.firstActivity || messageDate < customer.firstActivity) {
      customer.firstActivity = messageDate;
    }
    if (!customer.lastActivity || messageDate > customer.lastActivity) {
      customer.lastActivity = messageDate;
    }
    
    // Count message types
    if (message.Type === 'Incoming') {
      customer.incomingCount++;
    } else if (message.Type === 'Outgoing') {
      customer.outgoingCount++;
    }
    
    // Analyze message content
    this.analyzeMessageContent(message, customer);
  }

  // Extract phone number from message data
  extractPhoneNumber(message) {
    const senderId = message['Sender ID'] || '';
    const senderName = message['Sender Name'] || '';
    
    // Look for phone numbers in sender ID
    const phoneRegex = /(\+?255|0)?[67]\d{8}/g;
    const matches = senderId.match(phoneRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }
    
    // Look for phone numbers in sender name
    const nameMatches = senderName.match(phoneRegex);
    if (nameMatches && nameMatches.length > 0) {
      return nameMatches[0];
    }
    
    return null;
  }

  // Extract customer name from message data
  extractCustomerName(message) {
    const senderName = message['Sender Name'] || '';
    const chatSession = message['Chat Session'] || '';
    
    // If sender name looks like a name (not a service), use it
    if (senderName && !this.isServiceName(senderName)) {
      return senderName;
    }
    
    // Use chat session if it looks like a name
    if (chatSession && !this.isServiceName(chatSession)) {
      return chatSession;
    }
    
    return 'Unknown Customer';
  }

  // Check if a name is actually a service name
  isServiceName(name) {
    const serviceNames = [
      'CRDB BANK', 'crdb bank', 'crdbbank', 'Vodacom', 'tigopesa', 'm-pesa', 'M-PESA', 
      'M-Pesa Card', 'du.', 'EQUITYBANK', 'MIXX BY YAS', 'WhatsApp', 'iMessage', 'SMS'
    ];
    
    return serviceNames.some(service => 
      name.toLowerCase().includes(service.toLowerCase())
    );
  }

  // Normalize phone number for consistent customer ID
  normalizePhoneNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('255')) {
      return digits;
    } else if (digits.startsWith('0') && digits.length === 10) {
      return '255' + digits.substring(1);
    } else if (digits.length === 9) {
      return '255' + digits;
    }
    
    return digits;
  }

  // Analyze message content for customer insights
  analyzeMessageContent(message, customer) {
    const text = (message.Text || '').toLowerCase();
    const chatSession = (message['Chat Session'] || '').toLowerCase();
    
    // Detect business indicators
    if (text.includes('business') || text.includes('company') || text.includes('office') ||
        text.includes('biashara') || text.includes('kampuni')) {
      customer.businessIndicators.add('business_mention');
    }
    
    if (text.includes('gari') || text.includes('car') || text.includes('vehicle')) {
      customer.businessIndicators.add('vehicle_related');
    }
    
    if (text.includes('laki') || text.includes('million') || text.includes('thousand') ||
        text.includes('pesa') || text.includes('malipo')) {
      customer.businessIndicators.add('financial_discussion');
    }
    
    // Detect personal indicators
    if (text.includes('mambo') || text.includes('vipi') || text.includes('habari') ||
        text.includes('asante') || text.includes('sawa')) {
      customer.personalIndicators.add('casual_greeting');
    }
    
    if (text.includes('kaka') || text.includes('boss') || text.includes('mkuu') ||
        text.includes('dada') || text.includes('rafiki')) {
      customer.personalIndicators.add('personal_relationship');
    }
    
    if (text.includes('niko') || text.includes('nakuja') || text.includes('nakufata') ||
        text.includes('uko wapi') || text.includes('location')) {
      customer.personalIndicators.add('location_coordination');
    }
    
    // Detect service types
    if (text.includes('repair') || text.includes('fix') || text.includes('tengeneza') ||
        text.includes('simu') || text.includes('phone')) {
      customer.serviceTypes.add('repair');
    }
    
    if (text.includes('buy') || text.includes('purchase') || text.includes('nunua') ||
        text.includes('ununue') || text.includes('ununua')) {
      customer.serviceTypes.add('purchase');
      customer.purchaseCount++;
    }
    
    if (text.includes('sell') || text.includes('uza') || text.includes('uzi')) {
      customer.serviceTypes.add('sell');
    }
    
    // Detect complaints
    if (text.includes('complaint') || text.includes('problem') || text.includes('tatizo') || 
        text.includes('complain') || text.includes('mbaya') || text.includes('shida')) {
      customer.complaintCount++;
    }
    
    // Detect locations
    if (text.includes('dar') || text.includes('dar es salaam')) {
      customer.locations.add('Dar es Salaam');
    }
    if (text.includes('arusha')) {
      customer.locations.add('Arusha');
    }
    if (text.includes('dubai') || text.includes('uae')) {
      customer.locations.add('Dubai');
    }
    
    // Detect languages
    if (text.includes('habari') || text.includes('asante') || text.includes('sawa') ||
        text.includes('mambo') || text.includes('vipi')) {
      customer.languages.add('Swahili');
    }
    if (text.includes('hello') || text.includes('thank you') || text.includes('okay') ||
        text.includes('yes') || text.includes('no')) {
      customer.languages.add('English');
    }
    
    // Extract financial amounts
    const amountMatches = text.match(/(?:laki|million|thousand|tsh|tzs|sh)\s*([0-9,]+)/gi);
    if (amountMatches) {
      amountMatches.forEach(match => {
        const amount = parseInt(match.replace(/[^\d]/g, ''));
        if (amount > 0) {
          customer.totalSpent += amount;
        }
      });
    }
  }

  // Calculate customer scores and categorization
  calculateCustomerScores() {
    console.log('🧮 Calculating customer scores...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    for (const [customerId, customer] of this.customers) {
      // Determine customer type
      if (customer.businessIndicators.size > customer.personalIndicators.size) {
        customer.customerType = 'business';
      } else if (customer.personalIndicators.size > customer.businessIndicators.size) {
        customer.customerType = 'personal';
      } else {
        customer.customerType = 'mixed';
      }
      
      // Engagement Score (0-100)
      customer.engagementScore = this.calculateEngagementScore(customer);
      
      // Loyalty Score (0-100)
      customer.loyaltyScore = this.calculateLoyaltyScore(customer);
    }
  }

  // Calculate engagement score
  calculateEngagementScore(customer) {
    const now = new Date();
    const daysSinceLastActivity = Math.floor((now - customer.lastActivity) / (1000 * 60 * 60 * 24));
    
    let score = 0;
    
    // Message frequency (40 points)
    if (customer.messageCount >= 50) score += 40;
    else if (customer.messageCount >= 20) score += 30;
    else if (customer.messageCount >= 10) score += 20;
    else if (customer.messageCount >= 5) score += 10;
    
    // Recency (30 points)
    if (daysSinceLastActivity <= 7) score += 30;
    else if (daysSinceLastActivity <= 30) score += 20;
    else if (daysSinceLastActivity <= 90) score += 10;
    
    // Two-way communication (30 points)
    const responseRatio = customer.incomingCount / Math.max(customer.outgoingCount, 1);
    if (responseRatio >= 0.5) score += 30;
    else if (responseRatio >= 0.3) score += 20;
    else if (responseRatio >= 0.1) score += 10;
    
    return Math.min(score, 100);
  }

  // Calculate loyalty score
  calculateLoyaltyScore(customer) {
    let score = 0;
    
    // Message frequency (30 points)
    if (customer.messageCount >= 100) score += 30;
    else if (customer.messageCount >= 50) score += 25;
    else if (customer.messageCount >= 20) score += 20;
    else if (customer.messageCount >= 10) score += 15;
    else if (customer.messageCount >= 5) score += 10;
    
    // Service diversity (25 points)
    if (customer.serviceTypes.size >= 3) score += 25;
    else if (customer.serviceTypes.size >= 2) score += 20;
    else if (customer.serviceTypes.size >= 1) score += 15;
    
    // Relationship indicators (25 points)
    if (customer.personalIndicators.has('personal_relationship')) score += 25;
    else if (customer.personalIndicators.has('casual_greeting')) score += 15;
    
    // Complaint handling (20 points)
    if (customer.complaintCount === 0) score += 20;
    else if (customer.complaintCount <= 2) score += 10;
    
    return Math.min(score, 100);
  }

  // Categorize customers for promotion targeting
  categorizeCustomers() {
    console.log('📊 Categorizing real customers for promotions...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    for (const [customerId, customer] of this.customers) {
      // Active customers (recent activity)
      if (customer.lastActivity > thirtyDaysAgo) {
        this.promotionTargets.activeCustomers.push(customer);
      }
      
      // Business customers
      if (customer.customerType === 'business' || customer.businessIndicators.size > 0) {
        this.promotionTargets.businessCustomers.push(customer);
      }
      
      // Personal customers
      if (customer.customerType === 'personal' || customer.personalIndicators.size > 0) {
        this.promotionTargets.personalCustomers.push(customer);
      }
      
      // New customers
      if (customer.firstActivity > thirtyDaysAgo) {
        this.promotionTargets.newCustomers.push(customer);
      }
      
      // Loyal customers
      if (customer.loyaltyScore > 70 && customer.engagementScore > 60) {
        this.promotionTargets.loyalCustomers.push(customer);
      }
    }
    
    // Sort each category by relevance
    this.promotionTargets.activeCustomers.sort((a, b) => b.engagementScore - a.engagementScore);
    this.promotionTargets.businessCustomers.sort((a, b) => b.businessIndicators.size - a.businessIndicators.size);
    this.promotionTargets.loyalCustomers.sort((a, b) => b.loyaltyScore - a.loyaltyScore);
  }

  // Generate promotion recommendations
  generatePromotionRecommendations() {
    console.log('🎯 Generating promotion recommendations...');
    
    const recommendations = {
      activeCustomers: {
        count: this.promotionTargets.activeCustomers.length,
        reason: 'Active customers - maintain engagement with regular offers',
        strategy: 'Regular promotions, loyalty rewards, new product announcements',
        customers: this.promotionTargets.activeCustomers.slice(0, 10)
      },
      businessCustomers: {
        count: this.promotionTargets.businessCustomers.length,
        reason: 'Business customers - offer B2B services and bulk discounts',
        strategy: 'Bulk pricing, business packages, corporate services',
        customers: this.promotionTargets.businessCustomers.slice(0, 10)
      },
      personalCustomers: {
        count: this.promotionTargets.personalCustomers.length,
        reason: 'Personal customers - offer individual services and personal touch',
        strategy: 'Personalized offers, individual discounts, relationship building',
        customers: this.promotionTargets.personalCustomers.slice(0, 10)
      },
      newCustomers: {
        count: this.promotionTargets.newCustomers.length,
        reason: 'New customers - welcome offers and onboarding',
        strategy: 'Welcome discounts, service introductions, first-time buyer offers',
        customers: this.promotionTargets.newCustomers.slice(0, 10)
      },
      loyalCustomers: {
        count: this.promotionTargets.loyalCustomers.length,
        reason: 'Loyal customers - retention and advocacy programs',
        strategy: 'Exclusive benefits, referral programs, VIP treatment',
        customers: this.promotionTargets.loyalCustomers.slice(0, 10)
      }
    };
    
    return recommendations;
  }

  // Export results
  exportResults(outputPath) {
    const results = {
      summary: {
        totalCustomers: this.customers.size,
        totalMessages: this.messageData.length,
        analysisDate: new Date().toISOString()
      },
      promotionTargets: this.generatePromotionRecommendations(),
      allCustomers: Array.from(this.customers.values()).map(customer => ({
        ...customer,
        serviceTypes: Array.from(customer.serviceTypes),
        paymentMethods: Array.from(customer.paymentMethods),
        locations: Array.from(customer.locations),
        languages: Array.from(customer.languages),
        businessIndicators: Array.from(customer.businessIndicators),
        personalIndicators: Array.from(customer.personalIndicators)
      }))
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📁 Results exported to: ${outputPath}`);
  }

  // Main analysis function
  async analyze(csvFilePath) {
    console.log('🚀 Starting Real Customer Analysis...\n');
    
    // Parse message data
    this.parseMessageData(csvFilePath);
    
    // Calculate scores
    this.calculateCustomerScores();
    
    // Categorize customers
    this.categorizeCustomers();
    
    // Generate recommendations
    const recommendations = this.generatePromotionRecommendations();
    
    // Print summary
    console.log('\n📊 REAL CUSTOMER PROMOTION TARGETING SUMMARY\n');
    console.log('='.repeat(60));
    
    Object.entries(recommendations).forEach(([key, rec]) => {
      console.log(`\n🎯 ${rec.reason}`);
      console.log(`   Count: ${rec.count} customers`);
      console.log(`   Strategy: ${rec.strategy}`);
    });
    
    // Export results
    const timestamp = new Date().toISOString().split('T')[0];
    this.exportResults(`real-customer-analysis-${timestamp}.json`);
    
    console.log('\n✅ Real customer analysis complete!');
    console.log('📁 Check the generated files for detailed results.');
    
    return recommendations;
  }
}

// Usage
async function main() {
  const analyzer = new RealCustomerAnalyzer();
  const csvPath = '/Users/mtaasisi/Documents/Messages - 5210 chat sessions.csv';
  
  try {
    await analyzer.analyze(csvPath);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
main();
