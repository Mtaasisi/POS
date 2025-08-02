# Customer CSV Update Import

This feature allows you to update existing customer records by importing a CSV file. The system will only update fields that are currently null/empty in the existing customer records.

## How to Use

1. **Navigate to Customers Page**: Go to the main customers page in your application.

2. **Click "Update Existing" Button**: Look for the "Update Existing" button in the header section (orange button with refresh icon).

3. **Upload CSV File**: 
   - Click "Choose CSV File" to select your CSV file
   - Or download the template first to see the expected format

4. **Preview and Match**: 
   - The system will show you which customers from your CSV match existing customers
   - Only matched customers will be updated
   - You can toggle between "Show Matched Only" and "Show All"

5. **Review and Import**: 
   - Review the preview to see which fields will be updated
   - Click "Update X Customers" to proceed with the import

## CSV Format

Your CSV should have the following columns (headers are case-insensitive):

```
Name,Email,Phone,Gender,City,WhatsApp,Notes,Loyalty Level,Color Tag,Referral Source,Location Description,National ID,Referred By,Birth Month,Birth Day
```

### Required Fields:
- **Name**: Customer's full name
- **Phone**: Phone number (used for matching existing customers)

### Optional Fields:
- **Email**: Customer's email address
- **Gender**: male, female, or other
- **City**: Customer's city
- **WhatsApp**: WhatsApp number
- **Notes**: Additional notes about the customer
- **Loyalty Level**: bronze, silver, gold, or platinum
- **Color Tag**: normal, vip, complainer, or purchased
- **Referral Source**: How the customer found you
- **Location Description**: Detailed location information
- **National ID**: Customer's national ID
- **Referred By**: Who referred this customer
- **Birth Month**: Birth month (1-12)
- **Birth Day**: Birth day (1-31)

## How It Works

1. **Matching**: The system matches customers by:
   - Phone number (primary)
   - WhatsApp number (secondary)
   - Email address (tertiary)

2. **Update Logic**: Only fields that are currently null/empty in the existing customer record will be updated. This prevents overwriting existing data.

3. **Validation**: The system validates:
   - Required fields are present
   - Phone numbers are properly formatted
   - Email addresses are valid
   - Birth dates are within valid ranges

## Example CSV

```csv
Name,Email,Phone,Gender,City,WhatsApp,Notes,Loyalty Level,Color Tag,Referral Source,Location Description,National ID,Referred By,Birth Month,Birth Day
John Doe,john.updated@example.com,+255123456789,male,Dar es Salaam Updated,+255123456789,Updated customer notes,bronze,normal,Instagram,Updated City Center,123456789,John Smith,January,15
Jane Smith,jane.updated@example.com,+255987654321,female,Arusha Updated,+255987654321,Updated notes,bronze,vip,Friend,Updated Suburb Area,987654321,Jane Doe,March,22
```

## Important Notes

- **Admin Only**: This feature is only available to administrators and customer care staff
- **No New Customers**: This feature only updates existing customers, it does not create new ones
- **Safe Updates**: Only null/empty fields are updated to prevent data loss
- **Phone Matching**: Make sure phone numbers in your CSV match existing customer phone numbers exactly
- **Backup**: Always backup your data before performing bulk updates

## Troubleshooting

- **No Matches Found**: Ensure phone numbers in your CSV exactly match existing customer phone numbers
- **Validation Errors**: Check that all required fields are present and properly formatted
- **Import Fails**: Verify you have admin permissions and try with a smaller CSV file first

## Test File

Use the included `test_customer_update.csv` file to test the functionality with your existing customer data. 