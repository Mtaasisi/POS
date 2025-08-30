# Setup Guide: Sample Electronics Data

## 🚀 **Quick Start Guide**

This guide will help you populate your LATS inventory system with sample electronics data including categories, brands, and suppliers.

## 📋 **What You'll Get**

### **Categories Structure:**
```
Electronics (Main Category)
├── Laptops
│   ├── Gaming Laptops
│   ├── Business Laptops
│   └── Student Laptops
├── Mobile Phones
│   ├── Android Phones
│   └── iPhones
├── Audio & Sound
│   ├── Soundbars
│   ├── Bluetooth Speakers
│   └── Headphones
├── Accessories
│   ├── Phone Accessories
│   ├── Laptop Accessories
│   └── Audio Accessories
└── Gaming
    └── Gaming Accessories
```

### **Brands Included:**
- **Major Brands**: Samsung, Apple, Vizio
- **Laptop Brands**: ASUS, MSI, Lenovo, Dell, HP, Acer
- **Mobile Brands**: Google, OnePlus
- **Audio Brands**: JBL, Sony, Bose
- **Accessories**: Logitech, Razer, SteelSeries, OtterBox, Anker, Targus
- **Audio Accessories**: AudioQuest, Monoprice, Kanto

### **Suppliers:**
- TechDistributors Inc. (Primary electronics)
- MobileWorld Supply (Mobile devices)
- AudioPro Distributors (Audio equipment)
- GamingGear Supply (Gaming accessories)
- AccessoryHub (Phone and laptop accessories)

## 🔧 **Setup Instructions**

### **Step 1: Access Your Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section
3. Click **"New Query"**

### **Step 2: Run the Sample Data Script**
1. Copy the entire content from `scripts/populate-electronics-sample-data.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script

### **Step 3: Verify the Data**
After running the script, you should see:
- **Categories created**: 15 categories (1 main + 5 subcategories + 9 sub-subcategories)
- **Brands created**: 23 brands
- **Suppliers created**: 5 suppliers

### **Step 4: Check Your LATS App**
1. Go to your LATS application
2. Navigate to **Inventory Management** → **Categories**
3. You should see the hierarchical category structure
4. Check **Brands** and **Suppliers** sections

## 🎯 **Next Steps**

### **Add Products**
Once you have the categories and brands set up, you can start adding products:

1. **Go to**: Inventory Management → Products
2. **Click**: "Add Product"
3. **Select**: Category and Brand from the dropdowns
4. **Fill in**: Product details (name, price, stock, description)
5. **Save**: Your product

### **Sample Product Examples**
You can add products like:
- **Samsung Galaxy S23** (Mobile Phones → Android Phones → Samsung)
- **Vizio V-Series 5.1 Soundbar** (Audio & Sound → Soundbars → Vizio)
- **ASUS ROG Strix G15** (Laptops → Gaming Laptops → ASUS)
- **Apple 20W USB-C Charger** (Accessories → Phone Accessories → Apple)

## 🔄 **Customization Options**

### **Modify Categories**
- **Add new categories**: Use the category management interface
- **Edit existing categories**: Change names, colors, descriptions
- **Reorganize hierarchy**: Move categories between parents

### **Add More Brands**
- **Go to**: Inventory Management → Brands
- **Click**: "Add Brand"
- **Fill in**: Brand details and logo URL

### **Update Suppliers**
- **Go to**: Inventory Management → Suppliers
- **Add**: Your actual suppliers with real contact information

## ⚠️ **Important Notes**

### **Data Safety**
- The script is safe to run multiple times
- It won't overwrite existing data unless you uncomment the DELETE statements
- All data is properly structured with relationships

### **Brand Logos**
- Brand logos use Clearbit's logo service
- You can replace these with your own logo URLs
- Some logos might not load if the service is unavailable

### **Pricing**
- Sample data doesn't include actual product prices
- Add realistic prices based on your market
- Consider currency and local pricing

## 🆘 **Troubleshooting**

### **Script Won't Run**
- **Check**: You have proper permissions in Supabase
- **Verify**: All tables exist (lats_categories, lats_brands, lats_suppliers)
- **Ensure**: You're in the correct database schema

### **Categories Not Showing**
- **Refresh**: Your LATS application
- **Check**: Category management page loads properly
- **Verify**: Subcategories feature is working

### **Missing Data**
- **Check**: SQL execution logs for errors
- **Verify**: All INSERT statements completed successfully
- **Run**: The verification queries at the end of the script

## 📞 **Support**

If you encounter any issues:
1. **Check**: The troubleshooting section above
2. **Review**: SQL execution logs in Supabase
3. **Contact**: Support with specific error messages

---

**Happy Inventory Management!** 🎉
