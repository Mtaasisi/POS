# 🔧 Inventory System Setup Guide

## 🚨 **Current Issue: No Products Showing**

The inventory system is not showing products because the **Supabase database connection is not configured**.

## ✅ **Quick Fix**

### **Step 1: Configure Supabase Connection**

1. **Create a Supabase project** (if you don't have one):
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Update your `.env` file** with your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

3. **Run the database migrations**:
   ```bash
   # Apply the inventory schema
   npx supabase db push
   ```

### **Step 2: Test the Connection**

Run the diagnostic script to verify the connection:
```bash
node debug_inventory.js
```

### **Step 3: Start the Application**

```bash
npm run dev
```

## 🎯 **Expected Results**

After proper configuration, you should see:
- ✅ Products loading in the inventory page
- ✅ Categories and suppliers data
- ✅ No "Database connection failed" errors

## 🔍 **Troubleshooting**

### **Error: "Invalid API key"**
- Check that your `VITE_SUPABASE_ANON_KEY` is correct
- Make sure there are no extra spaces or quotes

### **Error: "fetch failed"**
- Check your internet connection
- Verify the `VITE_SUPABASE_URL` is correct

### **Error: "No products found"**
- Run the database migrations
- Check if the `lats_products` table exists
- Verify RLS policies allow reading

## 📊 **Fallback Data**

If you can't connect to Supabase immediately, the system will show sample products so you can test the UI functionality.

## 🆘 **Need Help?**

1. Check the browser console for detailed error messages
2. Verify your Supabase project is active
3. Ensure your database has the required tables
4. Check RLS policies allow public read access

---

**Note**: The inventory system is designed to work offline with sample data, but for full functionality, you need a working Supabase connection.