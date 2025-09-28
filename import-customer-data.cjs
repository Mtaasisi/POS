const fs = require('fs');

class CustomerDataImporter {
  constructor() {
    this.analysisData = null;
    this.importResults = {
      success: 0,
      failed: 0,
      errors: []
    };
  }

  // Load the analysis data
  loadAnalysisData(filePath) {
    try {
      console.log('📂 Loading customer analysis data...');
      const data = fs.readFileSync(filePath, 'utf-8');
      this.analysisData = JSON.parse(data);
      console.log(`✅ Loaded data for ${this.analysisData.summary.totalCustomers} customers`);
      return true;
    } catch (error) {
      console.error('❌ Error loading analysis data:', error.message);
      return false;
    }
  }

  // Generate SQL insert statements for high-value customers
  generateHighValueCustomerSQL() {
    if (!this.analysisData) {
      console.error('❌ No analysis data loaded');
      return;
    }

    const highValueCustomers = this.analysisData.promotionTargets.highValueCustomers.customers;
    const sqlStatements = [];

    console.log(`📝 Generating SQL for ${highValueCustomers.length} high-value customers...`);

    highValueCustomers.forEach((customer, index) => {
      // Generate a unique customer ID if not exists
      const customerId = `customer_${customer.id}_${Date.now()}_${index}`;
      
      const sql = `
-- High Value Customer: ${customer.name} (${customer.phone})
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  '${customerId}',
  '${customer.name.replace(/'/g, "''")}',
  '${customer.phone}',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  ${Math.floor(customer.totalSpent / 1000)}, -- Points based on spending
  ${customer.totalSpent},
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS ${customer.totalSpent.toLocaleString()}, Messages: ${customer.messageCount}, Loyalty Score: ${customer.loyaltyScore}%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, ${customer.totalSpent}),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();`;

      sqlStatements.push(sql);
    });

    return sqlStatements;
  }

  // Generate SQL for customer communications
  generateCommunicationHistorySQL() {
    if (!this.analysisData) {
      console.error('❌ No analysis data loaded');
      return;
    }

    const sqlStatements = [];
    console.log('📝 Generating communication history SQL...');

    // Process all customers and their messages
    this.analysisData.allCustomers.forEach(customer => {
      if (customer.messages && customer.messages.length > 0) {
        customer.messages.forEach((message, index) => {
          const commId = `comm_${customer.id}_${index}_${Date.now()}`;
          
          const sql = `
INSERT INTO customer_communications (
  id,
  customer_id,
  type,
  message,
  status,
  phone_number,
  sent_at,
  created_at
) VALUES (
  '${commId}',
  'customer_${customer.id}_${Date.now()}_0', -- Reference to customer
  '${message.Service?.toLowerCase() || 'sms'}',
  '${(message.Text || '').replace(/'/g, "''").substring(0, 500)}',
  '${message.Status?.toLowerCase() || 'sent'}',
  '${customer.phone}',
  '${message['Message Date'] || new Date().toISOString()}',
  NOW()
) ON CONFLICT (id) DO NOTHING;`;

          sqlStatements.push(sql);
        });
      }
    });

    return sqlStatements;
  }

  // Generate promotion targeting recommendations
  generatePromotionRecommendations() {
    if (!this.analysisData) {
      console.error('❌ No analysis data loaded');
      return;
    }

    const recommendations = this.analysisData.promotionTargets;
    
    console.log('\n🎯 PROMOTION TARGETING RECOMMENDATIONS\n');
    console.log('='.repeat(60));

    Object.entries(recommendations).forEach(([key, rec]) => {
      console.log(`\n📊 ${rec.reason.toUpperCase()}`);
      console.log(`   👥 Count: ${rec.count} customers`);
      console.log(`   💡 Strategy: ${rec.strategy}`);
      
      if (rec.customers && rec.customers.length > 0) {
        console.log(`   🏆 Top Customers:`);
        rec.customers.slice(0, 3).forEach((customer, index) => {
          console.log(`      ${index + 1}. ${customer.name} (${customer.phone}) - TZS ${customer.totalSpent.toLocaleString()}`);
        });
      }
    });

    return recommendations;
  }

  // Generate actionable promotion strategies
  generateActionableStrategies() {
    const strategies = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    const recs = this.analysisData.promotionTargets;

    // Immediate actions (this week)
    if (recs.highValueCustomers.count > 0) {
      strategies.immediate.push({
        action: 'Send VIP offers to high-value customers',
        target: `${recs.highValueCustomers.count} customers`,
        message: 'Exclusive 20% discount on premium services',
        priority: 'HIGH'
      });
    }

    if (recs.inactiveCustomers.count > 0) {
      strategies.immediate.push({
        action: 'Launch re-engagement campaign',
        target: `${recs.inactiveCustomers.count} inactive customers`,
        message: 'We miss you! Special comeback offer - 30% off',
        priority: 'MEDIUM'
      });
    }

    // Short-term actions (this month)
    if (recs.newCustomers.count > 0) {
      strategies.shortTerm.push({
        action: 'Welcome new customers',
        target: `${recs.newCustomers.count} new customers`,
        message: 'Welcome! Get 15% off your first purchase',
        priority: 'HIGH'
      });
    }

    if (recs.complaintCustomers.count > 0) {
      strategies.shortTerm.push({
        action: 'Service recovery campaign',
        target: `${recs.complaintCustomers.count} customers with complaints`,
        message: 'We apologize for any inconvenience. Here\'s a special offer to make it right.',
        priority: 'HIGH'
      });
    }

    // Long-term actions (next 3 months)
    if (recs.loyalCustomers.count > 0) {
      strategies.longTerm.push({
        action: 'Loyalty program enhancement',
        target: `${recs.loyalCustomers.count} loyal customers`,
        message: 'Exclusive loyalty benefits and referral rewards',
        priority: 'MEDIUM'
      });
    }

    return strategies;
  }

  // Export SQL files
  exportSQLFiles() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // High-value customers SQL
    const highValueSQL = this.generateHighValueCustomerSQL();
    if (highValueSQL) {
      const highValueSQLContent = `-- High Value Customers Import
-- Generated on ${new Date().toISOString()}
-- Total customers: ${highValueSQL.length}

${highValueSQL.join('\n')}`;
      
      fs.writeFileSync(`high-value-customers-${timestamp}.sql`, highValueSQLContent);
      console.log(`📁 High-value customers SQL exported: high-value-customers-${timestamp}.sql`);
    }

    // Communication history SQL (sample)
    const commSQL = this.generateCommunicationHistorySQL();
    if (commSQL && commSQL.length > 0) {
      const sampleCommSQL = commSQL.slice(0, 100); // Limit to first 100 for sample
      const commSQLContent = `-- Customer Communications Import (Sample)
-- Generated on ${new Date().toISOString()}
-- Sample of ${sampleCommSQL.length} communications (out of ${commSQL.length} total)

${sampleCommSQL.join('\n')}`;
      
      fs.writeFileSync(`customer-communications-sample-${timestamp}.sql`, commSQLContent);
      console.log(`📁 Communication history SQL exported: customer-communications-sample-${timestamp}.sql`);
    }
  }

  // Generate promotion action plan
  generateActionPlan() {
    const strategies = this.generateActionableStrategies();
    const timestamp = new Date().toISOString().split('T')[0];
    
    const actionPlan = {
      generated: new Date().toISOString(),
      summary: this.analysisData.summary,
      strategies: strategies,
      recommendations: this.generatePromotionRecommendations()
    };

    fs.writeFileSync(`promotion-action-plan-${timestamp}.json`, JSON.stringify(actionPlan, null, 2));
    console.log(`📁 Action plan exported: promotion-action-plan-${timestamp}.json`);

    // Generate HTML action plan
    const htmlContent = this.generateActionPlanHTML(actionPlan);
    fs.writeFileSync(`promotion-action-plan-${timestamp}.html`, htmlContent);
    console.log(`📁 HTML action plan exported: promotion-action-plan-${timestamp}.html`);
  }

  // Generate HTML action plan
  generateActionPlanHTML(actionPlan) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Promotion Action Plan</title>
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
        .strategy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .strategy-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
        .strategy-card.high { border-left-color: #dc3545; }
        .strategy-card.medium { border-left-color: #ffc107; }
        .strategy-card h4 { margin: 0 0 10px 0; color: #333; }
        .strategy-card .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .strategy-card .priority.high { background: #dc3545; color: white; }
        .strategy-card .priority.medium { background: #ffc107; color: #333; }
        .strategy-card .target { color: #666; font-size: 0.9em; margin: 5px 0; }
        .strategy-card .message { background: #e3f2fd; padding: 10px; border-radius: 4px; margin-top: 10px; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Customer Promotion Action Plan</h1>
            <p>Generated on ${new Date(actionPlan.generated).toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Customers</h3>
                <div class="number">${actionPlan.summary.totalCustomers}</div>
            </div>
            <div class="summary-card">
                <h3>Total Messages</h3>
                <div class="number">${actionPlan.summary.totalMessages}</div>
            </div>
            <div class="summary-card">
                <h3>High Value</h3>
                <div class="number">${actionPlan.recommendations.highValueCustomers.count}</div>
            </div>
            <div class="summary-card">
                <h3>Inactive</h3>
                <div class="number">${actionPlan.recommendations.inactiveCustomers.count}</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚀 Immediate Actions (This Week)</h2>
            <div class="strategy-grid">
                ${actionPlan.strategies.immediate.map(strategy => `
                <div class="strategy-card ${strategy.priority.toLowerCase()}">
                    <h4>${strategy.action}</h4>
                    <div class="priority ${strategy.priority.toLowerCase()}">${strategy.priority}</div>
                    <div class="target">Target: ${strategy.target}</div>
                    <div class="message">"${strategy.message}"</div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>📅 Short-term Actions (This Month)</h2>
            <div class="strategy-grid">
                ${actionPlan.strategies.shortTerm.map(strategy => `
                <div class="strategy-card ${strategy.priority.toLowerCase()}">
                    <h4>${strategy.action}</h4>
                    <div class="priority ${strategy.priority.toLowerCase()}">${strategy.priority}</div>
                    <div class="target">Target: ${strategy.target}</div>
                    <div class="message">"${strategy.message}"</div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 Long-term Actions (Next 3 Months)</h2>
            <div class="strategy-grid">
                ${actionPlan.strategies.longTerm.map(strategy => `
                <div class="strategy-card ${strategy.priority.toLowerCase()}">
                    <h4>${strategy.action}</h4>
                    <div class="priority ${strategy.priority.toLowerCase()}">${strategy.priority}</div>
                    <div class="target">Target: ${strategy.target}</div>
                    <div class="message">"${strategy.message}"</div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  // Main import function
  async runImport(analysisFilePath) {
    console.log('🚀 Starting Customer Data Import Process...\n');
    
    // Load analysis data
    if (!this.loadAnalysisData(analysisFilePath)) {
      return;
    }

    // Generate promotion recommendations
    this.generatePromotionRecommendations();

    // Generate actionable strategies
    const strategies = this.generateActionableStrategies();
    console.log('\n📋 ACTIONABLE STRATEGIES\n');
    console.log('='.repeat(50));
    
    console.log('\n🚀 IMMEDIATE ACTIONS (This Week):');
    strategies.immediate.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy.action}`);
      console.log(`      Target: ${strategy.target}`);
      console.log(`      Message: "${strategy.message}"`);
      console.log(`      Priority: ${strategy.priority}\n`);
    });

    console.log('\n📅 SHORT-TERM ACTIONS (This Month):');
    strategies.shortTerm.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy.action}`);
      console.log(`      Target: ${strategy.target}`);
      console.log(`      Message: "${strategy.message}"`);
      console.log(`      Priority: ${strategy.priority}\n`);
    });

    console.log('\n🎯 LONG-TERM ACTIONS (Next 3 Months):');
    strategies.longTerm.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy.action}`);
      console.log(`      Target: ${strategy.target}`);
      console.log(`      Message: "${strategy.message}"`);
      console.log(`      Priority: ${strategy.priority}\n`);
    });

    // Export files
    this.exportSQLFiles();
    this.generateActionPlan();

    console.log('\n✅ Import process complete!');
    console.log('📁 Check the generated files for implementation.');
  }
}

// Usage
async function main() {
  const importer = new CustomerDataImporter();
  const analysisFile = 'customer-analysis-2025-09-24.json';
  
  try {
    await importer.runImport(analysisFile);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

// Run the import
main();
