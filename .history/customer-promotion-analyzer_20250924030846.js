import fs from 'fs';
import path from 'path';

class CustomerPromotionAnalyzer {
  constructor() {
    this.customers = new Map();
    this.messageData = [];
    this.promotionTargets = {
      highValue: [],
      frequentBuyers: [],
      inactiveCustomers: [],
      newCustomers: [],
      complaintCustomers: [],
      loyalCustomers: []
    };
  }

  // Parse CSV and extract customer data
  parseMessageData(csvFilePath) {
    try {
      console.log('📊 Parsing message data...');
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      console.log(`📋 Found ${lines.length - 1} messages`);
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;
        
        const message = {};
        headers.forEach((header, index) => {
          message[header.trim()] = values[index]?.trim() || '';
        });
        
        this.messageData.push(message);
        this.processMessage(message);
      }
      
      console.log(`✅ Processed ${this.messageData.length} messages`);
      console.log(`👥 Identified ${this.customers.size} unique customers`);
      
    } catch (error) {
      console.error('❌ Error parsing CSV:', error.message);
    }
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
        promotionEligibility: {
          highValue: false,
          frequentBuyer: false,
          inactive: false,
          newCustomer: false,
          hasComplaints: false,
          loyal: false
        }
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
    // Try different fields that might contain phone numbers
    const possibleFields = ['Sender ID', 'Sender Name', 'Text'];
    
    for (const field of possibleFields) {
      const value = message[field] || '';
      
      // Look for Tanzanian phone numbers
      const tzPhoneRegex = /(\+?255|0)?[67]\d{8}/g;
      const matches = value.match(tzPhoneRegex);
      
      if (matches && matches.length > 0) {
        return matches[0];
      }
      
      // Look for UAE phone numbers
      const uaePhoneRegex = /(\+?971|0)?[56]\d{8}/g;
      const uaeMatches = value.match(uaePhoneRegex);
      
      if (uaeMatches && uaeMatches.length > 0) {
        return uaeMatches[0];
      }
    }
    
    return null;
  }

  // Extract customer name from message data
  extractCustomerName(message) {
    const senderName = message['Sender Name'] || '';
    const text = message.Text || '';
    
    // If sender name looks like a name (not a service), use it
    if (senderName && !this.isServiceName(senderName)) {
      return senderName;
    }
    
    // Try to extract name from message text
    const namePatterns = [
      /(?:Hello|Hi|Habari)\s+([A-Za-z\s]+?)(?:\s|,|\.|!)/i,
      /([A-Za-z\s]+?)\s+(?:here|speaking)/i,
      /Name:\s*([A-Za-z\s]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Unknown Customer';
  }

  // Check if a name is actually a service name
  isServiceName(name) {
    const serviceNames = [
      'M-Pesa Card', 'CRDB BANK', 'tigopesa', 'm-pesa', 'M-PESA', 'vodacom',
      'vodataarifa', 'du.', 'EQUITYBANK', 'WhatsApp', 'iMessage', 'SMS'
    ];
    
    return serviceNames.some(service => 
      name.toLowerCase().includes(service.toLowerCase())
    );
  }

  // Normalize phone number for consistent customer ID
  normalizePhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle Tanzanian numbers
    if (digits.startsWith('255')) {
      return digits;
    } else if (digits.startsWith('0') && digits.length === 10) {
      return '255' + digits.substring(1);
    } else if (digits.length === 9) {
      return '255' + digits;
    }
    
    // Handle UAE numbers
    if (digits.startsWith('971')) {
      return digits;
    } else if (digits.startsWith('0') && digits.length === 10) {
      return '971' + digits.substring(1);
    } else if (digits.length === 9) {
      return '971' + digits;
    }
    
    return digits;
  }

  // Analyze message content for customer insights
  analyzeMessageContent(message, customer) {
    const text = (message.Text || '').toLowerCase();
    const chatSession = (message['Chat Session'] || '').toLowerCase();
    
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
    
    // Detect payment methods
    if (text.includes('m-pesa') || text.includes('mpesa')) {
      customer.paymentMethods.add('m-pesa');
    }
    if (text.includes('cash') || text.includes('pesa')) {
      customer.paymentMethods.add('cash');
    }
    if (text.includes('card') || text.includes('kadi')) {
      customer.paymentMethods.add('card');
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
    if (text.includes('habari') || text.includes('asante') || text.includes('sawa')) {
      customer.languages.add('Swahili');
    }
    if (text.includes('hello') || text.includes('thank you') || text.includes('okay')) {
      customer.languages.add('English');
    }
    
    // Extract financial amounts
    const amountMatches = text.match(/(?:tsh|tzs|sh)\s*([0-9,]+)/gi);
    if (amountMatches) {
      amountMatches.forEach(match => {
        const amount = parseInt(match.replace(/[^\d]/g, ''));
        if (amount > 0) {
          customer.totalSpent += amount;
        }
      });
    }
  }

  // Calculate customer scores and promotion eligibility
  calculateCustomerScores() {
    console.log('🧮 Calculating customer scores...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    for (const [customerId, customer] of this.customers) {
      // Engagement Score (0-100)
      customer.engagementScore = this.calculateEngagementScore(customer);
      
      // Loyalty Score (0-100)
      customer.loyaltyScore = this.calculateLoyaltyScore(customer);
      
      // Promotion Eligibility
      customer.promotionEligibility = {
        highValue: customer.totalSpent > 100000, // TZS 100,000+
        frequentBuyer: customer.purchaseCount >= 3,
        inactive: customer.lastActivity < ninetyDaysAgo,
        newCustomer: customer.firstActivity > thirtyDaysAgo,
        hasComplaints: customer.complaintCount > 0,
        loyal: customer.loyaltyScore > 70 && customer.engagementScore > 60
      };
    }
  }

  // Calculate engagement score based on message frequency and recency
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

  // Calculate loyalty score based on spending and service history
  calculateLoyaltyScore(customer) {
    let score = 0;
    
    // Spending level (40 points)
    if (customer.totalSpent >= 500000) score += 40; // TZS 500,000+
    else if (customer.totalSpent >= 200000) score += 30; // TZS 200,000+
    else if (customer.totalSpent >= 100000) score += 20; // TZS 100,000+
    else if (customer.totalSpent >= 50000) score += 10; // TZS 50,000+
    
    // Purchase frequency (30 points)
    if (customer.purchaseCount >= 10) score += 30;
    else if (customer.purchaseCount >= 5) score += 20;
    else if (customer.purchaseCount >= 3) score += 15;
    else if (customer.purchaseCount >= 1) score += 10;
    
    // Service diversity (20 points)
    if (customer.serviceTypes.size >= 3) score += 20;
    else if (customer.serviceTypes.size >= 2) score += 15;
    else if (customer.serviceTypes.size >= 1) score += 10;
    
    // Complaint handling (10 points) - lower complaints = higher score
    if (customer.complaintCount === 0) score += 10;
    else if (customer.complaintCount <= 2) score += 5;
    
    return Math.min(score, 100);
  }

  // Categorize customers for promotion targeting
  categorizeCustomers() {
    console.log('📊 Categorizing customers for promotions...');
    
    for (const [customerId, customer] of this.customers) {
      const eligibility = customer.promotionEligibility;
      
      if (eligibility.highValue) {
        this.promotionTargets.highValue.push(customer);
      }
      
      if (eligibility.frequentBuyer) {
        this.promotionTargets.frequentBuyers.push(customer);
      }
      
      if (eligibility.inactive) {
        this.promotionTargets.inactiveCustomers.push(customer);
      }
      
      if (eligibility.newCustomer) {
        this.promotionTargets.newCustomers.push(customer);
      }
      
      if (eligibility.hasComplaints) {
        this.promotionTargets.complaintCustomers.push(customer);
      }
      
      if (eligibility.loyal) {
        this.promotionTargets.loyalCustomers.push(customer);
      }
    }
    
    // Sort each category by relevance
    this.promotionTargets.highValue.sort((a, b) => b.totalSpent - a.totalSpent);
    this.promotionTargets.frequentBuyers.sort((a, b) => b.purchaseCount - a.purchaseCount);
    this.promotionTargets.loyalCustomers.sort((a, b) => b.loyaltyScore - a.loyaltyScore);
  }

  // Generate promotion recommendations
  generatePromotionRecommendations() {
    console.log('🎯 Generating promotion recommendations...');
    
    const recommendations = {
      highValueCustomers: {
        count: this.promotionTargets.highValue.length,
        reason: 'High spending customers - offer premium products/services',
        strategy: 'VIP treatment, exclusive offers, early access to new products',
        customers: this.promotionTargets.highValue.slice(0, 10)
      },
      frequentBuyers: {
        count: this.promotionTargets.frequentBuyers.length,
        reason: 'Regular customers - offer loyalty rewards and bulk discounts',
        strategy: 'Volume discounts, loyalty points, referral bonuses',
        customers: this.promotionTargets.frequentBuyers.slice(0, 10)
      },
      inactiveCustomers: {
        count: this.promotionTargets.inactiveCustomers.length,
        reason: 'Inactive customers - re-engagement campaigns',
        strategy: 'Win-back offers, special discounts, "we miss you" messages',
        customers: this.promotionTargets.inactiveCustomers.slice(0, 10)
      },
      newCustomers: {
        count: this.promotionTargets.newCustomers.length,
        reason: 'New customers - welcome offers and onboarding',
        strategy: 'Welcome discounts, first-time buyer offers, service introductions',
        customers: this.promotionTargets.newCustomers.slice(0, 10)
      },
      complaintCustomers: {
        count: this.promotionTargets.complaintCustomers.length,
        reason: 'Customers with complaints - service recovery',
        strategy: 'Apology offers, service improvements, satisfaction surveys',
        customers: this.promotionTargets.complaintCustomers.slice(0, 10)
      },
      loyalCustomers: {
        count: this.promotionTargets.loyalCustomers.length,
        reason: 'Loyal customers - retention and advocacy',
        strategy: 'Exclusive benefits, referral programs, premium services',
        customers: this.promotionTargets.loyalCustomers.slice(0, 10)
      }
    };
    
    return recommendations;
  }

  // Export results to JSON
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
        languages: Array.from(customer.languages)
      }))
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📁 Results exported to: ${outputPath}`);
  }

  // Generate HTML report
  generateHTMLReport(outputPath) {
    const recommendations = this.generatePromotionRecommendations();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Promotion Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .customer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .customer-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .customer-card h4 { margin: 0 0 10px 0; color: #333; }
        .customer-card .phone { color: #666; font-size: 0.9em; }
        .customer-card .stats { display: flex; justify-content: space-between; margin-top: 10px; }
        .customer-card .stat { text-align: center; }
        .customer-card .stat .label { font-size: 0.8em; color: #666; }
        .customer-card .stat .value { font-weight: bold; color: #007bff; }
        .strategy { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px; }
        .strategy h4 { margin: 0 0 10px 0; color: #1976d2; }
        .reason { background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 15px; }
        .reason h4 { margin: 0 0 10px 0; color: #f57c00; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Customer Promotion Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Customers</h3>
                <div class="number">${this.customers.size}</div>
            </div>
            <div class="summary-card">
                <h3>Total Messages</h3>
                <div class="number">${this.messageData.length}</div>
            </div>
            <div class="summary-card">
                <h3>High Value Customers</h3>
                <div class="number">${recommendations.highValueCustomers.count}</div>
            </div>
            <div class="summary-card">
                <h3>Loyal Customers</h3>
                <div class="number">${recommendations.loyalCustomers.count}</div>
            </div>
        </div>
        
        ${Object.entries(recommendations).map(([key, rec]) => `
        <div class="section">
            <h2>${rec.reason}</h2>
            <div class="reason">
                <h4>Why Target This Group:</h4>
                <p>${rec.reason}</p>
            </div>
            <div class="strategy">
                <h4>Recommended Strategy:</h4>
                <p>${rec.strategy}</p>
            </div>
            <div class="customer-grid">
                ${rec.customers.map(customer => `
                <div class="customer-card">
                    <h4>${customer.name}</h4>
                    <div class="phone">${customer.phone}</div>
                    <div class="stats">
                        <div class="stat">
                            <div class="label">Spent</div>
                            <div class="value">TZS ${customer.totalSpent.toLocaleString()}</div>
                        </div>
                        <div class="stat">
                            <div class="label">Messages</div>
                            <div class="value">${customer.messageCount}</div>
                        </div>
                        <div class="stat">
                            <div class="label">Loyalty</div>
                            <div class="value">${customer.loyaltyScore}%</div>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>`;
    
    fs.writeFileSync(outputPath, html);
    console.log(`📊 HTML report generated: ${outputPath}`);
  }

  // Main analysis function
  async analyze(csvFilePath) {
    console.log('🚀 Starting Customer Promotion Analysis...\n');
    
    // Parse message data
    this.parseMessageData(csvFilePath);
    
    // Calculate scores
    this.calculateCustomerScores();
    
    // Categorize customers
    this.categorizeCustomers();
    
    // Generate recommendations
    const recommendations = this.generatePromotionRecommendations();
    
    // Print summary
    console.log('\n📊 PROMOTION TARGETING SUMMARY\n');
    console.log('='.repeat(50));
    
    Object.entries(recommendations).forEach(([key, rec]) => {
      console.log(`\n🎯 ${rec.reason}`);
      console.log(`   Count: ${rec.count} customers`);
      console.log(`   Strategy: ${rec.strategy}`);
    });
    
    // Export results
    const timestamp = new Date().toISOString().split('T')[0];
    this.exportResults(`customer-analysis-${timestamp}.json`);
    this.generateHTMLReport(`customer-promotion-report-${timestamp}.html`);
    
    console.log('\n✅ Analysis complete!');
    console.log('📁 Check the generated files for detailed results.');
    
    return recommendations;
  }
}

// Usage
async function main() {
  const analyzer = new CustomerPromotionAnalyzer();
  const csvPath = '/Users/mtaasisi/Documents/Messages - 5210 chat sessions.csv';
  
  try {
    await analyzer.analyze(csvPath);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CustomerPromotionAnalyzer;
