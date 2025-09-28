const fs = require('fs');

class ArushaCustomerAnalyzer {
  constructor() {
    this.customers = new Map();
    this.messageData = [];
    this.arushaCustomers = [];
  }

  // Parse CSV and extract Arusha customer data
  parseMessageData(csvFilePath) {
    try {
      console.log('📊 Parsing Arusha customer data...');
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      console.log(`📋 Found ${lines.length - 1} total messages`);
      
      let arushaMessages = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;
        
        const message = {};
        headers.forEach((header, index) => {
          message[header.trim()] = values[index]?.trim() || '';
        });
        
        // Check if message is related to Arusha
        if (this.isArushaRelated(message)) {
          this.messageData.push(message);
          this.processMessage(message);
          arushaMessages++;
        }
      }
      
      console.log(`✅ Processed ${arushaMessages} Arusha-related messages`);
      console.log(`👥 Identified ${this.customers.size} unique Arusha customers`);
      
    } catch (error) {
      console.error('❌ Error parsing CSV:', error.message);
    }
  }

  // Check if message is related to Arusha
  isArushaRelated(message) {
    const text = (message.Text || '').toLowerCase();
    const senderName = (message['Sender Name'] || '').toLowerCase();
    const chatSession = (message['Chat Session'] || '').toLowerCase();
    
    // Skip service notifications
    const serviceNames = [
      'crdb bank', 'vodacom', 'tigopesa', 'm-pesa', 'm-pesa card', 'du.', 
      'equitybank', 'mixx by yas', 'whatsapp', 'imessage'
    ];
    
    if (serviceNames.some(service => 
      senderName.includes(service) || chatSession.includes(service)
    )) {
      return false;
    }
    
    // Check for Arusha mentions
    const arushaKeywords = [
      'arusha', 'arusha car wash', 'arusha tour', 'arusha office',
      'kutoka arusha', 'kuja arusha', 'yupo arusha', 'arusha bar'
    ];
    
    return arushaKeywords.some(keyword => 
      text.includes(keyword) || senderName.includes(keyword) || chatSession.includes(keyword)
    );
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
        locations: new Set(['Arusha']),
        languages: new Set(),
        businessType: 'unknown',
        engagementScore: 0,
        loyaltyScore: 0,
        arushaConnection: 'direct'
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
      'crdb bank', 'vodacom', 'tigopesa', 'm-pesa', 'm-pesa card', 'du.', 
      'equitybank', 'mixx by yas', 'whatsapp', 'imessage', 'sms'
    ];
    
    return serviceNames.some(service => 
      name.toLowerCase().includes(service)
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
    const senderName = (message['Sender Name'] || '').toLowerCase();
    
    // Detect business type
    if (text.includes('car wash') || text.includes('car') || text.includes('gari')) {
      customer.businessType = 'automotive';
      customer.serviceTypes.add('car_wash');
    }
    
    if (text.includes('tour') || text.includes('safari') || text.includes('travel')) {
      customer.businessType = 'tourism';
      customer.serviceTypes.add('tourism');
    }
    
    if (text.includes('furniture') || text.includes('furnicher') || text.includes('utali')) {
      customer.businessType = 'furniture';
      customer.serviceTypes.add('furniture');
    }
    
    if (text.includes('bar') || text.includes('restaurant') || text.includes('food')) {
      customer.businessType = 'hospitality';
      customer.serviceTypes.add('hospitality');
    }
    
    // Detect service types
    if (text.includes('repair') || text.includes('fix') || text.includes('tengeneza')) {
      customer.serviceTypes.add('repair');
    }
    
    if (text.includes('buy') || text.includes('purchase') || text.includes('nunua')) {
      customer.serviceTypes.add('purchase');
      customer.purchaseCount++;
    }
    
    if (text.includes('sell') || text.includes('uza')) {
      customer.serviceTypes.add('sell');
    }
    
    // Detect complaints
    if (text.includes('complaint') || text.includes('problem') || text.includes('tatizo') || 
        text.includes('complain') || text.includes('mbaya')) {
      customer.complaintCount++;
    }
    
    // Detect languages
    if (text.includes('habari') || text.includes('asante') || text.includes('sawa') ||
        text.includes('mambo') || text.includes('vipi') || text.includes('kaka')) {
      customer.languages.add('Swahili');
    }
    if (text.includes('hello') || text.includes('thank you') || text.includes('okay')) {
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

  // Calculate customer scores
  calculateCustomerScores() {
    console.log('🧮 Calculating Arusha customer scores...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    for (const [customerId, customer] of this.customers) {
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
    if (customer.messageCount >= 20) score += 40;
    else if (customer.messageCount >= 10) score += 30;
    else if (customer.messageCount >= 5) score += 20;
    else if (customer.messageCount >= 2) score += 10;
    
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
    if (customer.messageCount >= 50) score += 30;
    else if (customer.messageCount >= 20) score += 25;
    else if (customer.messageCount >= 10) score += 20;
    else if (customer.messageCount >= 5) score += 15;
    else if (customer.messageCount >= 2) score += 10;
    
    // Service diversity (25 points)
    if (customer.serviceTypes.size >= 3) score += 25;
    else if (customer.serviceTypes.size >= 2) score += 20;
    else if (customer.serviceTypes.size >= 1) score += 15;
    
    // Business relationship (25 points)
    if (customer.businessType !== 'unknown') score += 25;
    else if (customer.serviceTypes.size > 0) score += 15;
    
    // Complaint handling (20 points)
    if (customer.complaintCount === 0) score += 20;
    else if (customer.complaintCount <= 2) score += 10;
    
    return Math.min(score, 100);
  }

  // Categorize Arusha customers
  categorizeArushaCustomers() {
    console.log('📊 Categorizing Arusha customers...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    for (const [customerId, customer] of this.customers) {
      // Add to Arusha customers list
      this.arushaCustomers.push({
        ...customer,
        serviceTypes: Array.from(customer.serviceTypes),
        languages: Array.from(customer.languages),
        isActive: customer.lastActivity > thirtyDaysAgo,
        isNew: customer.firstActivity > thirtyDaysAgo,
        isLoyal: customer.loyaltyScore > 70 && customer.engagementScore > 60
      });
    }
    
    // Sort by engagement score
    this.arushaCustomers.sort((a, b) => b.engagementScore - a.engagementScore);
  }

  // Generate Arusha-specific recommendations
  generateArushaRecommendations() {
    console.log('🎯 Generating Arusha-specific recommendations...');
    
    const activeCustomers = this.arushaCustomers.filter(c => c.isActive);
    const businessCustomers = this.arushaCustomers.filter(c => c.businessType !== 'unknown');
    const loyalCustomers = this.arushaCustomers.filter(c => c.isLoyal);
    const newCustomers = this.arushaCustomers.filter(c => c.isNew);
    
    const recommendations = {
      summary: {
        totalArushaCustomers: this.arushaCustomers.length,
        activeCustomers: activeCustomers.length,
        businessCustomers: businessCustomers.length,
        loyalCustomers: loyalCustomers.length,
        newCustomers: newCustomers.length
      },
      topCustomers: this.arushaCustomers.slice(0, 10),
      businessTypes: this.getBusinessTypeBreakdown(),
      recommendations: {
        activeCustomers: {
          count: activeCustomers.length,
          strategy: 'Maintain regular contact with active Arusha customers',
          message: 'Kaka, tunao offer mpya! Check out our latest deals for Arusha customers'
        },
        businessCustomers: {
          count: businessCustomers.length,
          strategy: 'Target Arusha businesses with B2B offers',
          message: 'Boss, tunao business package mpya for Arusha businesses'
        },
        loyalCustomers: {
          count: loyalCustomers.length,
          strategy: 'Reward loyal Arusha customers with exclusive offers',
          message: 'Asante kwa loyalty! Exclusive VIP offer for Arusha customers'
        },
        newCustomers: {
          count: newCustomers.length,
          strategy: 'Welcome new Arusha customers',
          message: 'Karibu Arusha! Here\'s 20% off your first purchase'
        }
      }
    };
    
    return recommendations;
  }

  // Get business type breakdown
  getBusinessTypeBreakdown() {
    const breakdown = {};
    
    this.arushaCustomers.forEach(customer => {
      const type = customer.businessType || 'unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    
    return breakdown;
  }

  // Export results
  exportResults(outputPath) {
    const recommendations = this.generateArushaRecommendations();
    
    const results = {
      summary: recommendations.summary,
      recommendations: recommendations.recommendations,
      businessTypes: recommendations.businessTypes,
      topCustomers: recommendations.topCustomers,
      allCustomers: this.arushaCustomers,
      analysisDate: new Date().toISOString()
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📁 Results exported to: ${outputPath}`);
  }

  // Main analysis function
  async analyze(csvFilePath) {
    console.log('🚀 Starting Arusha Customer Analysis...\n');
    
    // Parse message data
    this.parseMessageData(csvFilePath);
    
    // Calculate scores
    this.calculateCustomerScores();
    
    // Categorize customers
    this.categorizeArushaCustomers();
    
    // Generate recommendations
    const recommendations = this.generateArushaRecommendations();
    
    // Print summary
    console.log('\n📊 ARUSHA CUSTOMER ANALYSIS SUMMARY\n');
    console.log('='.repeat(50));
    
    console.log(`\n🏔️ Total Arusha Customers: ${recommendations.summary.totalArushaCustomers}`);
    console.log(`🚀 Active Customers: ${recommendations.summary.activeCustomers}`);
    console.log(`💼 Business Customers: ${recommendations.summary.businessCustomers}`);
    console.log(`⭐ Loyal Customers: ${recommendations.summary.loyalCustomers}`);
    console.log(`🆕 New Customers: ${recommendations.summary.newCustomers}`);
    
    console.log('\n🏢 Business Types in Arusha:');
    Object.entries(recommendations.businessTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} customers`);
    });
    
    console.log('\n🎯 Top Arusha Customers:');
    recommendations.topCustomers.slice(0, 5).forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name} (${customer.phone})`);
      console.log(`      Business: ${customer.businessType}, Messages: ${customer.messageCount}, Engagement: ${customer.engagementScore}%`);
    });
    
    // Export results
    const timestamp = new Date().toISOString().split('T')[0];
    this.exportResults(`arusha-customers-${timestamp}.json`);
    
    console.log('\n✅ Arusha customer analysis complete!');
    console.log('📁 Check the generated files for detailed results.');
    
    return recommendations;
  }
}

// Usage
async function main() {
  const analyzer = new ArushaCustomerAnalyzer();
  const csvPath = '/Users/mtaasisi/Documents/Messages - 5210 chat sessions.csv';
  
  try {
    await analyzer.analyze(csvPath);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
main();
