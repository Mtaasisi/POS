// Dynamic pricing system for LATS module
import { Customer } from '../../../types/customer';

export interface PricingRule {
  id: string;
  name: string;
  type: 'loyalty' | 'bulk' | 'time' | 'category' | 'custom';
  conditions: PricingCondition[];
  discount: DiscountConfig;
  priority: number;
  isActive: boolean;
}

export interface PricingCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
}

export interface DiscountConfig {
  type: 'percentage' | 'fixed' | 'tiered';
  value: number;
  maxDiscount?: number;
  minPurchase?: number;
}

export interface PricingContext {
  customer?: Customer;
  quantity: number;
  totalAmount: number;
  category?: string;
  brand?: string;
  timeOfDay?: number;
  dayOfWeek?: number;
  isHoliday?: boolean;
}

export class DynamicPricingService {
  private static instance: DynamicPricingService;
  private pricingRules: PricingRule[] = [];
  private holidayDates: Set<string> = new Set();

  static getInstance(): DynamicPricingService {
    if (!DynamicPricingService.instance) {
      DynamicPricingService.instance = new DynamicPricingService();
    }
    return DynamicPricingService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
    this.loadHolidayDates();
  }

  // Initialize default pricing rules
  private initializeDefaultRules(): void {
    this.pricingRules = [
      // VIP Customer Discount
      {
        id: 'vip-discount',
        name: 'VIP Customer Discount',
        type: 'loyalty',
        conditions: [
          { field: 'loyaltyLevel', operator: 'in', value: ['platinum', 'gold'] }
        ],
        discount: { type: 'percentage', value: 10, maxDiscount: 50000 },
        priority: 1,
        isActive: true
      },
      
      // Silver Customer Discount
      {
        id: 'silver-discount',
        name: 'Silver Customer Discount',
        type: 'loyalty',
        conditions: [
          { field: 'loyaltyLevel', operator: 'equals', value: 'silver' }
        ],
        discount: { type: 'percentage', value: 5, maxDiscount: 25000 },
        priority: 2,
        isActive: true
      },

      // Bulk Purchase Discount
      {
        id: 'bulk-discount-5',
        name: 'Bulk Purchase (5+ items)',
        type: 'bulk',
        conditions: [
          { field: 'quantity', operator: 'greater_than', value: 4 }
        ],
        discount: { type: 'percentage', value: 5, minPurchase: 10000 },
        priority: 3,
        isActive: true
      },

      {
        id: 'bulk-discount-10',
        name: 'Bulk Purchase (10+ items)',
        type: 'bulk',
        conditions: [
          { field: 'quantity', operator: 'greater_than', value: 9 }
        ],
        discount: { type: 'percentage', value: 10, minPurchase: 20000 },
        priority: 4,
        isActive: true
      },

      // Weekend Discount
      {
        id: 'weekend-discount',
        name: 'Weekend Special',
        type: 'time',
        conditions: [
          { field: 'dayOfWeek', operator: 'in', value: [0, 6] } // Sunday, Saturday
        ],
        discount: { type: 'percentage', value: 3, maxDiscount: 15000 },
        priority: 5,
        isActive: true
      },

      // Morning Discount
      {
        id: 'morning-discount',
        name: 'Early Bird Special',
        type: 'time',
        conditions: [
          { field: 'timeOfDay', operator: 'less_than', value: 12 } // Before noon
        ],
        discount: { type: 'percentage', value: 2, maxDiscount: 10000 },
        priority: 6,
        isActive: true
      }
    ];
  }

  // Load holiday dates (you can extend this with API calls)
  private loadHolidayDates(): void {
    const currentYear = new Date().getFullYear();
    const holidays = [
      `${currentYear}-01-01`, // New Year
      `${currentYear}-12-25`, // Christmas
      `${currentYear}-12-26`, // Boxing Day
      // Add more holidays as needed
    ];
    
    holidays.forEach(date => this.holidayDates.add(date));
  }

  // Calculate dynamic price for a product
  calculatePrice(
    basePrice: number, 
    context: PricingContext
  ): { finalPrice: number; appliedDiscounts: AppliedDiscount[] } {
    const appliedDiscounts: AppliedDiscount[] = [];
    let finalPrice = basePrice;
    let totalDiscount = 0;

    // Sort rules by priority (highest first)
    const applicableRules = this.pricingRules
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      if (this.evaluateRule(rule, context)) {
        const discount = this.calculateDiscount(rule, basePrice, context);
        
        if (discount > 0) {
          appliedDiscounts.push({
            ruleId: rule.id,
            ruleName: rule.name,
            discountAmount: discount,
            discountType: rule.discount.type,
            originalValue: rule.discount.value
          });

          totalDiscount += discount;
        }
      }
    }

    finalPrice = Math.max(0, basePrice - totalDiscount);
    
    return {
      finalPrice: Math.round(finalPrice),
      appliedDiscounts
    };
  }

  // Evaluate if a pricing rule applies
  private evaluateRule(rule: PricingRule, context: PricingContext): boolean {
    return rule.conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.field, context);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'greater_than':
          return fieldValue > condition.value;
        case 'less_than':
          return fieldValue < condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'in':
          return Array.isArray(condition.value) 
            ? condition.value.includes(fieldValue)
            : fieldValue === condition.value;
        default:
          return false;
      }
    });
  }

  // Get field value from context
  private getFieldValue(field: string, context: PricingContext): any {
    switch (field) {
      case 'loyaltyLevel':
        return context.customer?.loyaltyLevel;
      case 'quantity':
        return context.quantity;
      case 'totalAmount':
        return context.totalAmount;
      case 'category':
        return context.category;
      case 'brand':
        return context.brand;
      case 'timeOfDay':
        return context.timeOfDay || new Date().getHours();
      case 'dayOfWeek':
        return context.dayOfWeek || new Date().getDay();
      case 'isHoliday':
        return context.isHoliday || this.isHoliday();
      default:
        return null;
    }
  }

  // Calculate discount amount for a rule
  private calculateDiscount(
    rule: PricingRule, 
    basePrice: number, 
    context: PricingContext
  ): number {
    const { discount } = rule;
    let discountAmount = 0;

    // Check minimum purchase requirement
    if (discount.minPurchase && context.totalAmount < discount.minPurchase) {
      return 0;
    }

    switch (discount.type) {
      case 'percentage':
        discountAmount = (basePrice * discount.value) / 100;
        break;
      case 'fixed':
        discountAmount = discount.value;
        break;
      case 'tiered':
        discountAmount = this.calculateTieredDiscount(basePrice, discount, context);
        break;
    }

    // Apply maximum discount limit
    if (discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }

    return Math.max(0, discountAmount);
  }

  // Calculate tiered discount
  private calculateTieredDiscount(
    basePrice: number, 
    discount: DiscountConfig, 
    context: PricingContext
  ): number {
    // Example tiered discount: 5% for first 50K, 10% for next 50K, 15% for rest
    const tiers = [
      { threshold: 0, rate: 0.05 },
      { threshold: 50000, rate: 0.10 },
      { threshold: 100000, rate: 0.15 }
    ];

    let totalDiscount = 0;
    let remainingAmount = basePrice;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const nextTier = tiers[i + 1];
      
      if (remainingAmount <= 0) break;

      const tierAmount = nextTier 
        ? Math.min(remainingAmount, nextTier.threshold - tier.threshold)
        : remainingAmount;

      if (tierAmount > 0) {
        totalDiscount += tierAmount * tier.rate;
        remainingAmount -= tierAmount;
      }
    }

    return totalDiscount;
  }

  // Check if today is a holiday
  private isHoliday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.holidayDates.has(today);
  }

  // Add custom pricing rule
  addPricingRule(rule: Omit<PricingRule, 'id'>): string {
    const id = `custom-${Date.now()}`;
    const newRule: PricingRule = { ...rule, id };
    this.pricingRules.push(newRule);
    return id;
  }

  // Update pricing rule
  updatePricingRule(id: string, updates: Partial<PricingRule>): boolean {
    const index = this.pricingRules.findIndex(rule => rule.id === id);
    if (index !== -1) {
      this.pricingRules[index] = { ...this.pricingRules[index], ...updates };
      return true;
    }
    return false;
  }

  // Remove pricing rule
  removePricingRule(id: string): boolean {
    const index = this.pricingRules.findIndex(rule => rule.id === id);
    if (index !== -1) {
      this.pricingRules.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get all pricing rules
  getPricingRules(): PricingRule[] {
    return [...this.pricingRules];
  }

  // Calculate loyalty points earned
  calculateLoyaltyPoints(amount: number, customer?: Customer): number {
    let basePoints = Math.floor(amount / 100); // 1 point per 100 TZS

    // Bonus points for VIP customers
    if (customer?.loyaltyLevel === 'platinum') {
      basePoints = Math.floor(basePoints * 1.5); // 50% bonus
    } else if (customer?.loyaltyLevel === 'gold') {
      basePoints = Math.floor(basePoints * 1.25); // 25% bonus
    }

    return basePoints;
  }

  // Get pricing preview for a customer
  getPricingPreview(
    basePrice: number, 
    quantity: number, 
    customer?: Customer
  ): PricingPreview {
    const context: PricingContext = {
      customer,
      quantity,
      totalAmount: basePrice * quantity,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isHoliday: this.isHoliday()
    };

    const { finalPrice, appliedDiscounts } = this.calculatePrice(basePrice, context);
    const totalDiscount = basePrice - finalPrice;
    const discountPercentage = basePrice > 0 ? (totalDiscount / basePrice) * 100 : 0;
    const loyaltyPoints = this.calculateLoyaltyPoints(finalPrice * quantity, customer);

    return {
      basePrice,
      finalPrice,
      totalDiscount,
      discountPercentage,
      appliedDiscounts,
      loyaltyPoints,
      savings: totalDiscount * quantity
    };
  }
}

export interface AppliedDiscount {
  ruleId: string;
  ruleName: string;
  discountAmount: number;
  discountType: string;
  originalValue: number;
}

export interface PricingPreview {
  basePrice: number;
  finalPrice: number;
  totalDiscount: number;
  discountPercentage: number;
  appliedDiscounts: AppliedDiscount[];
  loyaltyPoints: number;
  savings: number;
}

export const dynamicPricingService = DynamicPricingService.getInstance();
