export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'customer-care' | 'technician';
  created_at: string;
  updated_at: string;
  points?: number; // Staff points for check-in rewards
}

export interface Device {
  id: string;
  customerId: string;
  customerName: string;
  phoneNumber: string;
  brand: string;
  model: string;
  serialNumber: string;
  issueDescription: string;
  status: DeviceStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  expectedReturnDate: string;
  remarks: Remark[];
  transitions: Transition[];
  estimatedHours?: number;
  // Warranty fields
  warrantyStart?: string;
  warrantyEnd?: string;
  warrantyStatus?: string;
  repairCount?: number;
  lastReturnDate?: string;
  // Missing fields from New Device Form
  unlockCode?: string;
  repairCost?: string;
  depositAmount?: string;
  diagnosisRequired?: boolean;
  deviceNotes?: string;
  deviceCost?: string;
  deviceCondition?: Record<string, boolean>;
  deviceImages?: string[];
  accessoriesConfirmed?: boolean;
  problemConfirmed?: boolean;
  privacyConfirmed?: boolean;
  // Purchase workflow fields
  purchaseType?: PurchaseType;
  purchasePrice?: number;
  sellerVerificationStatus?: SellerVerificationStatus;
  deviceOwnershipProof?: Record<string, any>;
  securityCheckStatus?: SecurityCheckStatus;
  blacklistCheckResult?: string;
  deviceConditionPhotos?: DevicePhoto[];
  adminApprovalStatus?: AdminApprovalStatus;
  adminApprovalNotes?: string;
  adminApprovalDate?: string;
  adminApprovalBy?: string;
  pickupLocation?: PickupLocation;
  pickupScheduledDate?: string;
  sellerSignature?: string;
  staffSignature?: string;
  transactionId?: string;
  // Checklist fields
  diagnosticChecklist?: any;
  repairChecklist?: any;
}

export interface DevicePhoto {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  uploadedBy: string;
  file?: File; // Optional file for temporary storage
  uploadedToStorage?: boolean; // Indicates if photo was uploaded to Supabase storage
}

export interface PickupLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  instructions?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export type PurchaseType = 'repair' | 'buy' | 'trade-in';
export type SellerVerificationStatus = 'pending' | 'verified' | 'rejected' | 'requires_review';
export type SecurityCheckStatus = 'pending' | 'passed' | 'failed' | 'requires_review';
export type AdminApprovalStatus = 'pending' | 'approved' | 'rejected' | 'requires_more_info';

export interface DevicePurchaseRequest {
  id: string;
  deviceId: string;
  sellerName: string;
  sellerPhone: string;
  sellerIdNumber?: string;
  sellerIdType?: 'national_id' | 'passport' | 'drivers_license' | 'other';
  sellerIdPhoto?: string;
  deviceConditionDescription?: string;
  askingPrice?: number;
  finalPrice?: number;
  negotiationNotes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceSecurityCheck {
  id: string;
  deviceId: string;
  checkType: 'imei_verification' | 'blacklist_check' | 'ownership_verification' | 'condition_assessment';
  checkResult: 'passed' | 'failed' | 'requires_review';
  checkDetails?: Record<string, any>;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

export interface PurchaseNotification {
  id: string;
  deviceId: string;
  notificationType: 'new_purchase_request' | 'security_check_failed' | 'admin_approval_required' | 'payment_received' | 'pickup_scheduled';
  title: string;
  message?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'actioned';
  createdAt: string;
  readAt?: string;
  actionedAt?: string;
  actionedBy?: string;
}

export interface Rating {
  id: string;
  deviceId: string;
  technicianId: string;
  score: number;
  comment: string;
  createdAt: string;
}

export type DeviceStatus = 
  | 'assigned' // Device assigned (matches DB)
  | 'diagnosis-started' // Diagnosis started (matches DB)
  | 'awaiting-parts' // Awaiting parts (matches DB)
  | 'in-repair' // In Repair (matches DB)
  | 'reassembled-testing' // Reassembled/Testing (matches DB)
  | 'repair-complete' // Repair Complete (matches DB)
  | 'returned-to-customer-care' // Returned to customer care (matches DB)
  | 'done' // Picked up/closed (matches DB)
  | 'failed'; // Repair failed (matches DB)



export interface Remark {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface Transition {
  id: string;
  fromStatus: DeviceStatus;
  toStatus: DeviceStatus;
  performedBy: string;
  timestamp: string;
  signature: string;
}

export interface Signature {
  id: string;
  deviceId: string;
  userId: string;
  role: string;
  timestamp: string;
  signatureData: string;
}

export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CustomerTag = 'vip' | 'new' | 'complainer' | 'purchased';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  gender: 'male' | 'female' | 'other';
  city: string;
  notes: CustomerNote[];
  joinedDate: string;
  loyaltyLevel: LoyaltyLevel;
  colorTag: CustomerTag;
  referredBy?: string;
  referrals: string[];
  totalSpent: number;
  points: number;
  lastVisit: string;
  isActive: boolean;
  isRead?: boolean; // Track if customer has been viewed/read
  profileImage?: string;
  promoHistory: PromoMessage[];
  payments: Payment[];
  devices: Device[]; // Added devices property
  // Additional fields from CustomerForm (not in database schema)
  referralSource?: string;
  birthMonth?: string;
  birthDay?: string;
  totalReturns?: number;
  // Initial notes from form (stored in database)
  initialNotes?: string;
  createdBy?: string; // Staff user ID who registered this customer
  // Additional database fields
  locationDescription?: string;
  nationalId?: string;
  // Loyalty program fields
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyJoinDate?: string;
  loyaltyLastVisit?: string;
  loyaltyRewardsRedeemed?: number;
  loyaltyTotalSpent?: number;
  isLoyaltyMember?: boolean;
}

export interface CustomerNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface PromoMessage {
  id: string;
  title: string;
  content: string;
  sentVia: 'sms' | 'email';
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface Payment {
  id: string;
  amount: number;
  currency: string; // Added currency field
  method: 'cash' | 'card' | 'transfer';
  date: string;
  type: 'payment' | 'deposit' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  createdBy?: string;
  createdAt?: string;
  source?: 'device_payment'; // To distinguish between device payments
  notes?: string;
}





export interface Customer {
  id: string;
  name: string;
  profile_image?: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  city: string;
  loyalty_level?: string;
  color_tag?: string;
  is_active?: boolean;
  created_at?: string;
  last_visit?: string;
  total_spent?: number;
  tags?: string[];
}

export interface Template {
  id: string;
  title: string;
  content: string;
  variables?: Record<string, string>;
  description?: string;
  template_type?: string;
  is_active?: boolean;
}

export interface Campaign {
  name: string;
  msgType: string;
  newMsg: string;
  mediaUrl?: string;
  selectedTemplate?: string;
}

export interface BulkResult {
  chatId: string;
  recipient: string;
  status: string;
  error?: string;
}



