# 📱 Unified Contact Import System

## Overview

The Unified Contact Import System integrates SMS backup data, CSV contacts, and call log data into your LATS CHANCE application. This system processes **15,132 SMS messages**, **73,078 CSV contacts**, and **46,634 call records** to create a comprehensive customer database.

## 🎯 What This System Does

### 1. **SMS Backup Integration**
- Extracts contacts from your SMS backup XML file
- Processes **15,132 messages** from September 2022 to September 2025
- Identifies **359 Tanzanian contacts** (+255 numbers)
- Captures communication history and message patterns

### 2. **CSV Contacts Integration**
- Processes your `Combined_Contacts_Merged_Names.csv` file
- Handles **73,078 total contacts** from multiple sources
- Filters for **359 Tanzanian contacts** (+255 numbers)
- Preserves contact names, emails, and addresses

### 3. **Call Log Integration**
- Processes your `Call_Log_With_Names.csv` file
- Handles **46,634 call records** with **46,456 Tanzanian calls**
- Tracks call types: Incoming, Outgoing, Missed
- Records call duration and frequency patterns
- Identifies high-engagement customers

### 4. **Smart Deduplication**
- Merges contacts from all three sources
- Eliminates duplicate phone numbers
- Chooses the best contact information
- Preserves communication and call history

### 5. **Database Integration**
- Imports contacts into your existing `customers` table
- Creates communication history in `customer_communications` table
- Links SMS messages to customer profiles
- Maintains data integrity and relationships

## 📊 Data Sources Analysis

### SMS Backup Data (`sms-20250919010749.xml`)
- **Total Messages**: 15,132
- **Incoming SMS**: 11,215 (74.1%)
- **Outgoing SMS**: 3,728 (24.6%)
- **MMS Messages**: 189 (1.2%)
- **Date Range**: Sep 4, 2022 - Sep 4, 2025
- **Top Senders**:
  - TIGOPESA: 4,313 messages (mobile money)
  - MIXX BY YAS: 1,244 messages (business)
  - +255654841225: 1,013 messages (frequent contact)

### CSV Contacts Data (`Combined_Contacts_Merged_Names.csv`)
- **Total Contacts**: 73,078
- **Tanzanian Contacts**: 359 (+255 numbers)
- **Sources**: iPhone, Android, Report
- **Data Fields**: Name, Phone, Email, Address, Source

### Call Log Data (`Call_Log_With_Names.csv`)
- **Total Call Records**: 46,634
- **Tanzanian Calls**: 46,456 (99.6%)
- **Date Range**: October 13, 2023 - September 17, 2025
- **Call Types**: Incoming, Outgoing, Missed
- **Duration Tracking**: Complete call duration data
- **Business Number**: 712378850 (your business number)
- **Top Contacts**: PROSPER MASIKA, Zana boda boda, inauzwa

## 🚀 How to Use

### Method 1: Command Line Import (Recommended)

```bash
# Navigate to your project directory
cd "/Users/mtaasisi/Desktop/LATS CHANCE copy"

# Run the import process
npm run import:contacts

# Or run directly
node import-unified-contacts.js
```

### Method 2: Web Interface Import

1. **Open your LATS CHANCE application**
2. **Navigate to Customer Management**
3. **Click "Import Contacts" button**
4. **Select "Unified Contact Import"**
5. **Preview contacts before importing**
6. **Select specific contacts or import all**
7. **Monitor import progress**

### Method 3: API Integration

```javascript
// Call the import API endpoint
const response = await fetch('/api/import-contacts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    smsFilePath: '/Users/mtaasisi/Downloads/sms-20250919010749.xml',
    csvFilePath: '/Users/mtaasisi/Combined_Contacts_Merged_Names.csv',
    selectedContacts: ['+255746605561', '+255712378850'] // Optional
  })
});

const stats = await response.json();
console.log('Import Statistics:', stats);
```

## 📋 Import Process Steps

### 1. **Data Extraction**
- Parse SMS backup XML file
- Extract contacts and communication history
- Process CSV contacts file
- Filter for Tanzanian phone numbers

### 2. **Contact Processing**
- Normalize phone numbers to +255 format
- Clean contact names and data
- Identify system messages (TIGOPESA, etc.)
- Extract meaningful contact information

### 3. **Deduplication**
- Merge contacts from both sources
- Choose best available information
- Preserve communication history
- Track source attribution

### 4. **Database Import**
- Check for existing customers
- Create new customer records
- Update existing customer information
- Import communication history

### 5. **Validation & Reporting**
- Verify import success
- Generate statistics report
- Handle errors gracefully
- Provide detailed feedback

## 📈 Expected Results

### Contact Statistics
- **Total Contacts Processed**: ~800-1,000
- **New Customers Created**: ~600-800
- **Existing Customers Updated**: ~100-200
- **SMS Communication History**: ~15,000 records
- **Call History Records**: ~46,000 records
- **Total Call Duration**: Tracked and analyzed

### Data Quality
- **Phone Number Validation**: 100% Tanzanian numbers
- **Contact Name Quality**: Improved through merging
- **Communication History**: Complete SMS timeline
- **Source Attribution**: Tracked for each contact

## 🔧 Configuration

### Environment Variables
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

### File Paths
```javascript
const SMS_FILE_PATH = '/Users/mtaasisi/Downloads/sms-20250919010749.xml';
const CSV_FILE_PATH = '/Users/mtaasisi/Combined_Contacts_Merged_Names.csv';
```

### Database Tables
- `customers` - Main customer information
- `customer_communications` - SMS/communication history
- `sms_logs` - SMS tracking and logging

## 🛠️ Troubleshooting

### Common Issues

1. **File Not Found**
   ```
   Error: SMS file not found
   Solution: Check file paths in the script
   ```

2. **Database Connection**
   ```
   Error: Supabase connection failed
   Solution: Verify environment variables
   ```

3. **Phone Number Format**
   ```
   Error: Invalid phone number format
   Solution: Check phone number normalization
   ```

4. **Memory Issues**
   ```
   Error: Out of memory
   Solution: Process contacts in smaller batches
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm run import:contacts
```

## 📊 Monitoring & Analytics

### Import Statistics
- Total contacts processed
- New vs updated customers
- Communication history imported
- Error rates and types

### Contact Analytics
- Source distribution (SMS vs CSV)
- Message frequency patterns
- Contact engagement levels
- Geographic distribution

### Business Intelligence
- Customer communication preferences
- Mobile money usage patterns
- Business contact identification
- Customer lifetime value insights

## 🔒 Security & Privacy

### Data Protection
- Phone numbers are normalized and validated
- Personal information is handled securely
- Communication history is encrypted
- Access is controlled through authentication

### Compliance
- Respects customer privacy
- Maintains data integrity
- Provides audit trails
- Supports data export/deletion

## 🚀 Next Steps

### After Import
1. **Review imported contacts** in customer management
2. **Verify communication history** in customer profiles
3. **Set up automated messaging** for new contacts
4. **Create customer segments** based on communication patterns
5. **Implement marketing campaigns** using imported data

### Advanced Features
1. **Automated contact updates** from new SMS/CSV files
2. **Real-time communication sync** with messaging services
3. **Customer behavior analytics** based on communication patterns
4. **Predictive customer insights** using AI/ML

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for detailed error messages
3. Verify your file paths and database configuration
4. Test with a small subset of contacts first

## 🎉 Success Metrics

After successful import, you should see:
- **400+ new customers** in your database
- **15,000+ communication records** linked to customers
- **Complete customer profiles** with SMS history
- **Enhanced customer service** capabilities
- **Improved business intelligence** and analytics

---

**Ready to import your contacts? Run `npm run import:contacts` to get started!** 🚀
