# Where to Find ZenoPay Integration in Your LATS UI

## 🎯 **Quick Access Locations**

### 1. **Main Navigation - LATS Dashboard**
**Path**: `/lats` → Click "ZenoPay Test" in Quick Actions

1. Go to your LATS dashboard at `/lats`
2. Look for the **"ZenoPay Test"** button in the Quick Actions section
3. Click it to access the test page

### 2. **Direct URL Access**
**URL**: `http://your-domain.com/lats/zenopay-test`

You can directly navigate to the test page using this URL.

### 3. **POS System Integration**
**Path**: `/pos` → Look for "Mobile Money" payment button

1. Go to your POS system at `/pos`
2. Add items to cart
3. Fill in customer details (name, email, phone)
4. Click the **"Mobile Money"** payment button
5. The ZenoPay payment modal will open

## 📍 **Navigation Paths**

### **From Dashboard:**
```
Dashboard → LATS → ZenoPay Test
```

### **From POS:**
```
Dashboard → POS System → Mobile Money Payment
```

### **From LATS Dashboard:**
```
Dashboard → LATS → Quick Actions → ZenoPay Test
```

## 🔧 **How to Access**

### **Method 1: Through LATS Dashboard**
1. **Login** to your LATS application
2. **Navigate** to `/lats` (LATS Dashboard)
3. **Find** the "ZenoPay Test" button in Quick Actions
4. **Click** to open the test page

### **Method 2: Through POS System**
1. **Login** to your LATS application
2. **Navigate** to `/pos` (POS System)
3. **Add products** to cart
4. **Enter customer details** (name, email, phone)
5. **Click** "Mobile Money" payment button
6. **Test** the payment flow

### **Method 3: Direct URL**
1. **Open** your browser
2. **Go to**: `http://your-domain.com/lats/zenopay-test`
3. **Login** if prompted
4. **Start testing** the payment integration

## 🎨 **UI Components Available**

### **1. ZenoPay Test Page** (`/lats/zenopay-test`)
- **Purpose**: Comprehensive testing of the payment integration
- **Features**:
  - Create payment orders
  - Check payment status
  - Process complete payments
  - View test results and logs
  - Real-time status updates

### **2. ZenoPay Payment Modal** (in POS)
- **Purpose**: Process actual payments in POS system
- **Features**:
  - Customer information validation
  - Payment order creation
  - Real-time status polling
  - Payment completion handling
  - Error handling and user feedback

### **3. ZenoPay Payment Button** (in POS)
- **Purpose**: Quick access to mobile money payments
- **Features**:
  - Validates customer data
  - Opens payment modal
  - Handles payment completion

## 🔍 **What You'll See**

### **In the Test Page:**
- **Test Controls**: Customer info, amount, test actions
- **Test Results**: Real-time status, error messages, test log
- **Instructions**: Step-by-step testing guide
- **Status Display**: Current order status with badges

### **In the POS System:**
- **Customer Fields**: Name, email, phone (required for mobile money)
- **Payment Button**: "Mobile Money" button with smartphone icon
- **Payment Modal**: Full payment flow with status updates
- **Success Handling**: Automatic cart clearing and sale completion

## 🚀 **Quick Start Testing**

### **Step 1: Access Test Page**
```
Dashboard → LATS → ZenoPay Test
```

### **Step 2: Fill Test Data**
- **Customer Name**: John Doe
- **Email**: john@example.com
- **Phone**: 0744963858
- **Amount**: 1000 TZS

### **Step 3: Test Payment Flow**
1. Click "Create Payment Order"
2. Click "Check Order Status"
3. Click "Process Complete Payment"
4. Monitor test results

### **Step 4: Check Logs**
- **Error Logs**: `/logs/zenopay_errors.log`
- **Webhook Logs**: `/logs/zenopay_webhooks.log`

## 📱 **Mobile Money Payment Flow**

### **In POS System:**
1. **Add items** to cart
2. **Enter customer details** (name, email, phone)
3. **Click "Mobile Money"** button
4. **Payment modal opens** with order details
5. **Customer receives** payment prompt on phone
6. **Payment status updates** automatically
7. **Sale completes** when payment confirmed

## 🔧 **Integration Points**

### **Backend Files:**
- `zenopay-config.php` - Configuration
- `zenopay-create-order.php` - Create orders
- `zenopay-check-status.php` - Check status
- `zenopay-webhook.php` - Handle notifications

### **Frontend Components:**
- `ZenoPayPaymentModal.tsx` - Payment modal
- `ZenoPayPaymentButton.tsx` - Payment button
- `useZenoPay.ts` - Custom hook
- `ZenoPayTestPage.tsx` - Test page

### **Updated Components:**
- `EnhancedPOSComponent.tsx` - Added ZenoPay button
- `PaymentSection.tsx` - Added ZenoPay option
- `LATSQuickActions.tsx` - Added test page link
- `LATSBreadcrumb.tsx` - Added navigation

## 🎯 **Summary**

The ZenoPay integration is now fully accessible through:

1. **Test Page**: `/lats/zenopay-test` - For development and testing
2. **POS System**: `/pos` - For actual payment processing
3. **Quick Actions**: LATS Dashboard - For easy access

Your customers can now pay using mobile money directly through your POS system! 🇹🇿

---

**Built for LATS - Simplifying Digital Payments in Tanzania 🇹🇿**

