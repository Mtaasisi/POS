# Contact Import Instructions

## Overview
This script will import all your contacts from the CSV file into your LATS database. It includes smart phone number formatting, duplicate detection, and comprehensive error handling.

## Files Created
- `import-contacts-to-database.js` - Main import script
- `run-contact-import.js` - Simple runner script
- `CONTACT_IMPORT_INSTRUCTIONS.md` - This instruction file

## Prerequisites
1. Make sure your Supabase database is running
2. Ensure the customers table exists in your database
3. Have Node.js installed

## How to Run

### Option 1: Using the runner script (Recommended)
```bash
node run-contact-import.js
```

### Option 2: Direct execution
```bash
node import-contacts-to-database.js
```

## What the Script Does

### 1. Data Processing
- **Phone Number Formatting**: Automatically formats phone numbers to Tanzanian format (+255)
- **Name Cleaning**: Removes emojis and special characters, capitalizes properly
- **Duplicate Detection**: Checks if customer already exists by phone or email
- **Validation**: Ensures required fields (name, phone) are present

### 2. Database Import
- Creates new customer records with default values:
  - City: "Dar es Salaam" (as per your preference)
  - Country: "Tanzania"
  - Loyalty Level: "bronze"
  - Color Tag: "new"
  - Source: "Contact Import" or original source from CSV

### 3. Error Handling
- Skips invalid records and reports errors
- Handles database connection issues
- Provides detailed progress reporting

## Expected Output
```
🎯 LATS Contact Import Tool
===========================

🚀 Starting contact import process...

📖 Reading CSV file...
📋 Headers found: ['Name', 'Phone', 'Email', 'Address', 'Source']
🔧 Using Supabase configuration: { url: 'http://127.0.0.1:54321', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }

🔄 Processing contacts...

✅ Row 2: Mm'we - Imported successfully
✅ Row 3: Plan Trip @ Safarihii.com - Imported successfully
⚠️  Row 4: Madonna Dangotte - Already exists (Madonna Dangotte)
❌ Row 5: Adeel Ally - Phone number too short
...

📊 Import Summary:
==================
Total contacts processed: 73079
✅ Successfully imported: 68432
⚠️  Duplicates skipped: 4231
❌ Errors: 416
📈 Success rate: 93.7%

🎉 Contact import process completed!
```

## Configuration Options

### Using Environment Variables (Optional)
If you want to use your production database, create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Default Settings
- **Database**: Uses local Supabase (127.0.0.1:54321)
- **Phone Format**: Tanzanian format (+255)
- **Default City**: Dar es Salaam
- **Default Country**: Tanzania
- **Loyalty Level**: Bronze
- **Color Tag**: New

## Troubleshooting

### Common Issues
1. **"Database connection failed"**
   - Ensure Supabase is running
   - Check if customers table exists

2. **"CSV file not found"**
   - Make sure `Combined_Contacts_Merged_Names.csv` is in the correct location
   - Check file permissions

3. **"Missing dependencies"**
   - Run `npm install` to install required packages

### Performance Notes
- The script processes contacts in batches to avoid overwhelming the database
- Large imports (70K+ contacts) may take 30-60 minutes
- Progress is shown in real-time

## Data Mapping

| CSV Column | Database Field | Notes |
|------------|----------------|-------|
| Name | name | Cleaned and formatted |
| Phone | phone | Formatted to +255 format |
| Email | email | Lowercased and trimmed |
| Address | address | Used as-is |
| Source | referral_source | Used as-is |

## Next Steps After Import
1. Review the import summary
2. Check for any errors that need manual attention
3. Update customer information as needed in your LATS system
4. Set up loyalty levels for important customers
5. Add notes or tags to categorize customers

## Support
If you encounter any issues, check the console output for detailed error messages. The script provides comprehensive logging to help identify and resolve problems.
