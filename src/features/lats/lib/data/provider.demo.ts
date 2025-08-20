import { v4 as uuidv4 } from 'uuid';
import { latsEventBus } from './eventBus';
import { LatsDataProvider } from './provider';
import { 
  Category, Brand, Supplier, Product, ProductVariant, StockMovement,
  PurchaseOrder, SparePart, SparePartUsage,
  CategoryFormData, BrandFormData, SupplierFormData, ProductFormData,
  PurchaseOrderFormData, ApiResponse, PaginatedResponse
} from '../../types/inventory';
import { 
  Cart, Sale, CartItem, ProcessSaleData, ProductSearchResult,
  InsufficientStockError, POSSettings
} from '../../types/pos';

// Demo Data Provider with in-memory storage
class DemoDataProvider implements LatsDataProvider {
  private categories: Category[] = [];
  private brands: Brand[] = [];
  private suppliers: Supplier[] = [];
  private products: Product[] = [];
  private stockMovements: StockMovement[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private spareParts: SparePart[] = [];
  private sparePartUsage: SparePartUsage[] = [];
  private cart: Cart | null = null;
  private sales: Sale[] = [];
  private posSettings: POSSettings = {

    currency: 'TZS',
    receiptHeader: 'LATS Device Repair',
    receiptFooter: 'Thank you for your business!',
    enableBarcode: true,
    enableQuickCash: false, // Disabled - not using this functionality
    defaultPaymentMethod: 'cash'
  };

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Initialize categories
    this.categories = [
      {
        id: 'cat-1',
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
        color: '#3B82F6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cat-2',
        name: 'Laptops',
        description: 'Portable computers and parts',
        color: '#10B981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cat-3',
        name: 'Tablets',
        description: 'Tablet devices and accessories',
        color: '#F59E0B',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Initialize brands
    this.brands = [
      {
        id: 'brand-1',
        name: 'Apple',
        logo: '/logos/apple.svg',
        website: 'https://apple.com',
        description: 'Premium technology products',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'brand-2',
        name: 'Samsung',
        logo: '/logos/samsung.svg',
        website: 'https://samsung.com',
        description: 'Innovative electronics',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'brand-3',
        name: 'Dell',
        logo: '/logos/dell.svg',
        website: 'https://dell.com',
        description: 'Reliable computing solutions',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Initialize suppliers
    this.suppliers = [
      {
        id: 'supp-1',
        name: 'Tech Supplies Ltd',
        contactPerson: 'John Doe',
        email: 'john@techsupplies.com',
        phone: '+254700123456',
        address: 'Nairobi, Kenya',
        website: 'https://techsupplies.com',
        notes: 'Reliable supplier for electronics',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'supp-2',
        name: 'Mobile Parts Kenya',
        contactPerson: 'Jane Smith',
        email: 'jane@mobileparts.co.ke',
        phone: '+254700654321',
        address: 'Mombasa, Kenya',
        website: 'https://mobileparts.co.ke',
        notes: 'Specialized in mobile phone parts',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Initialize products with variants
    this.products = [
      {
        id: 'prod-1',
        name: 'iPhone 13 Screen',
        description: 'High-quality replacement screen for iPhone 13',
        categoryId: 'cat-1',
        brandId: 'brand-1',
        supplierId: 'supp-1',
        images: ['/images/iphone13-screen.jpg'],
  
        isActive: true,
        variants: [
          {
            id: 'var-1',
            productId: 'prod-1',
            sku: 'IP13-SCR-001',
            name: 'Original Quality',
            attributes: { quality: 'original', color: 'black' },
            costPrice: 8000,
            sellingPrice: 12000,
            quantity: 15,
            minQuantity: 5,
            barcode: '1234567890123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'var-2',
            productId: 'prod-1',
            sku: 'IP13-SCR-002',
            name: 'Premium Quality',
            attributes: { quality: 'premium', color: 'black' },
            costPrice: 6000,
            sellingPrice: 9000,
            quantity: 25,
            minQuantity: 5,
            barcode: '1234567890124',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        totalQuantity: 40,
        totalValue: 435000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod-2',
        name: 'Samsung Galaxy S21 Battery',
        description: 'Replacement battery for Samsung Galaxy S21',
        categoryId: 'cat-1',
        brandId: 'brand-2',
        supplierId: 'supp-1',
        images: ['/images/s21-battery.jpg'],
  
        isActive: true,
        variants: [
          {
            id: 'var-3',
            productId: 'prod-2',
            sku: 'SGS21-BAT-001',
            name: 'Original Battery',
            attributes: { capacity: '4000mAh', type: 'lithium-ion' },
            costPrice: 3500,
            sellingPrice: 5500,
            quantity: 30,
            minQuantity: 5,
            barcode: '1234567890125',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        totalQuantity: 30,
        totalValue: 105000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod-3',
        name: 'MacBook Pro Charger',
        description: 'Original Apple MacBook Pro charger',
        categoryId: 'cat-2',
        brandId: 'brand-1',
        supplierId: 'supp-1',
        images: ['/images/macbook-charger.jpg'],
  
        isActive: true,
        variants: [
          {
            id: 'var-4',
            productId: 'prod-3',
            sku: 'MBP-CHG-001',
            name: '96W USB-C Charger',
            attributes: { power: '96W', connector: 'USB-C' },
            costPrice: 12000,
            sellingPrice: 18000,
            quantity: 12,
            minQuantity: 3,
            barcode: '1234567890126',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        totalQuantity: 12,
        totalValue: 144000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod-4',
        name: 'Dell Laptop Keyboard',
        description: 'Replacement keyboard for Dell laptops',
        categoryId: 'cat-2',
        brandId: 'brand-3',
        supplierId: 'supp-2',
        images: ['/images/dell-keyboard.jpg'],
  
        isActive: true,
        variants: [
          {
            id: 'var-5',
            productId: 'prod-4',
            sku: 'DLL-KBD-001',
            name: 'Standard Keyboard',
            attributes: { layout: 'US', backlight: 'no' },
            costPrice: 4500,
            sellingPrice: 7500,
            quantity: 18,
            minQuantity: 5,
            barcode: '1234567890127',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'var-6',
            productId: 'prod-4',
            sku: 'DLL-KBD-002',
            name: 'Backlit Keyboard',
            attributes: { layout: 'US', backlight: 'yes' },
            costPrice: 6000,
            sellingPrice: 9500,
            quantity: 10,
            minQuantity: 3,
            barcode: '1234567890128',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        totalQuantity: 28,
        totalValue: 171000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod-5',
        name: 'iPad Air Case',
        description: 'Protective case for iPad Air',
        categoryId: 'cat-3',
        brandId: 'brand-1',
        supplierId: 'supp-1',
        images: ['/images/ipad-case.jpg'],
  
        isActive: true,
        variants: [
          {
            id: 'var-7',
            productId: 'prod-5',
            sku: 'IPAD-CASE-001',
            name: 'Silicone Case',
            attributes: { material: 'silicone', color: 'black' },
            costPrice: 1500,
            sellingPrice: 2500,
            quantity: 50,
            minQuantity: 10,
            barcode: '1234567890129',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'var-8',
            productId: 'prod-5',
            sku: 'IPAD-CASE-002',
            name: 'Leather Case',
            attributes: { material: 'leather', color: 'brown' },
            costPrice: 2500,
            sellingPrice: 4000,
            quantity: 25,
            minQuantity: 5,
            barcode: '1234567890130',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        totalQuantity: 75,
        totalValue: 162500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Initialize spare parts
    this.spareParts = [
      {
        id: 'spare-1',
        name: 'Samsung Galaxy S21 Charging Port',
        description: 'Replacement charging port for Samsung Galaxy S21',
        categoryId: 'cat-1',
        partNumber: 'SGS21-CP-001',
        costPrice: 2500,
        sellingPrice: 4000,
        quantity: 12,
        minQuantity: 3,
        location: 'Shelf A1',
        barcode: '9876543210987',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Initialize cart
    this.cart = {
      id: 'cart-1',
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      itemCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Helper method to update product totals
  private updateProductTotals(productId: string) {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.totalQuantity = product.variants.reduce((sum, v) => sum + v.quantity, 0);
      product.totalValue = product.variants.reduce((sum, v) => sum + (v.quantity * v.costPrice), 0);
      product.updatedAt = new Date().toISOString();
    }
  }

  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return { ok: true, data: this.categories };
  }

  async createCategory(data: CategoryFormData): Promise<ApiResponse<Category>> {
    const category: Category = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.categories.push(category);
    latsEventBus.emit('lats:category.created', category);
    return { ok: true, data: category };
  }

  async updateCategory(id: string, data: CategoryFormData): Promise<ApiResponse<Category>> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) {
      return { ok: false, message: 'Category not found' };
    }
    this.categories[index] = { ...this.categories[index], ...data, updatedAt: new Date().toISOString() };
    latsEventBus.emit('lats:category.updated', this.categories[index]);
    return { ok: true, data: this.categories[index] };
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) {
      return { ok: false, message: 'Category not found' };
    }
    this.categories.splice(index, 1);
    latsEventBus.emit('lats:category.deleted', { id });
    return { ok: true };
  }

  // Brands
  async getBrands(): Promise<ApiResponse<Brand[]>> {
    return { ok: true, data: this.brands };
  }

  async createBrand(data: BrandFormData): Promise<ApiResponse<Brand>> {
    const brand: Brand = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.brands.push(brand);
    latsEventBus.emit('lats:brand.created', brand);
    return { ok: true, data: brand };
  }

  async updateBrand(id: string, data: BrandFormData): Promise<ApiResponse<Brand>> {
    const index = this.brands.findIndex(b => b.id === id);
    if (index === -1) {
      return { ok: false, message: 'Brand not found' };
    }
    this.brands[index] = { ...this.brands[index], ...data, updatedAt: new Date().toISOString() };
    latsEventBus.emit('lats:brand.updated', this.brands[index]);
    return { ok: true, data: this.brands[index] };
  }

  async deleteBrand(id: string): Promise<ApiResponse<void>> {
    const index = this.brands.findIndex(b => b.id === id);
    if (index === -1) {
      return { ok: false, message: 'Brand not found' };
    }
    this.brands.splice(index, 1);
    latsEventBus.emit('lats:brand.deleted', { id });
    return { ok: true };
  }

  // Suppliers
  async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    return { ok: true, data: this.suppliers };
  }

  async createSupplier(data: SupplierFormData): Promise<ApiResponse<Supplier>> {
    const supplier: Supplier = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.suppliers.push(supplier);
    latsEventBus.emit('lats:supplier.created', supplier);
    return { ok: true, data: supplier };
  }

  async updateSupplier(id: string, data: SupplierFormData): Promise<ApiResponse<Supplier>> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      return { ok: false, message: 'Supplier not found' };
    }
    this.suppliers[index] = { ...this.suppliers[index], ...data, updatedAt: new Date().toISOString() };
    latsEventBus.emit('lats:supplier.updated', this.suppliers[index]);
    return { ok: true, data: this.suppliers[index] };
  }

  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      return { ok: false, message: 'Supplier not found' };
    }
    this.suppliers.splice(index, 1);
    latsEventBus.emit('lats:supplier.deleted', { id });
    return { ok: true };
  }

  // Products
  async getProducts(filters?: any): Promise<ApiResponse<PaginatedResponse<Product>>> {
    let filteredProducts = [...this.products];
    
    if (filters?.categoryId) {
      filteredProducts = filteredProducts.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.description?.toLowerCase().includes(search)
      );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      ok: true,
      data: {
        data: filteredProducts.slice(start, end),
        total: filteredProducts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredProducts.length / limit)
      }
    };
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      return { ok: false, message: 'Product not found' };
    }
    return { ok: true, data: product };
  }

  async createProduct(data: ProductFormData): Promise<ApiResponse<Product>> {
    const product: Product = {
      id: uuidv4(),
      ...data,
      isActive: true, // Default to active
      variants: data.variants.map(v => ({
        id: uuidv4(),
        productId: '', // Will be set after product creation
        ...v,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      totalQuantity: 0,
      totalValue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Set productId for variants
    product.variants.forEach(v => v.productId = product.id);
    
    // Calculate totals
    this.updateProductTotals(product.id);
    
    this.products.push(product);
    latsEventBus.emit('lats:product.created', product);
    return { ok: true, data: product };
  }

  async updateProduct(id: string, data: ProductFormData): Promise<ApiResponse<Product>> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, message: 'Product not found' };
    }

    const updatedProduct = {
      ...this.products[index],
      ...data,
      variants: data.variants.map(v => ({
        id: uuidv4(), // Generate new ID for new variants
        productId: id,
        ...v,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      updatedAt: new Date().toISOString()
    };

    this.products[index] = updatedProduct;
    this.updateProductTotals(id);
    
    latsEventBus.emit('lats:product.updated', updatedProduct);
    return { ok: true, data: updatedProduct };
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, message: 'Product not found' };
    }
    this.products.splice(index, 1);
    latsEventBus.emit('lats:product.deleted', { id });
    return { ok: true };
  }

  async searchProducts(query: string): Promise<ApiResponse<ProductSearchResult[]>> {
    const search = query.toLowerCase();
    const results: ProductSearchResult[] = [];

    this.products.forEach(product => {
      if (product.name.toLowerCase().includes(search) || 
          product.description?.toLowerCase().includes(search)) {
        
        const category = this.categories.find(c => c.id === product.categoryId);
        const brand = product.brandId ? this.brands.find(b => b.id === product.brandId) : undefined;

        results.push({
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          categoryName: category?.name || '',
          brandId: product.brandId,
          brandName: brand?.name,
          variants: product.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            attributes: v.attributes,
            sellingPrice: v.sellingPrice,
            quantity: v.quantity,
            barcode: v.barcode
          })),
          images: product.images,

        });
      }
    });

    return { ok: true, data: results };
  }

  // Stock Management
  async adjustStock(
    productId: string,
    variantId: string,
    quantity: number,
    reason: string,
    reference?: string
  ): Promise<ApiResponse<StockMovement>> {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      return { ok: false, message: 'Product not found' };
    }

    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) {
      return { ok: false, message: 'Variant not found' };
    }

    const previousQuantity = variant.quantity;
    const newQuantity = Math.max(0, variant.quantity + quantity);
    
    if (newQuantity < 0) {
      return { ok: false, message: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' };
    }

    variant.quantity = newQuantity;
    variant.updatedAt = new Date().toISOString();
    
    this.updateProductTotals(productId);

    const movement: StockMovement = {
      id: uuidv4(),
      productId,
      variantId,
      type: quantity > 0 ? 'in' : 'out',
      quantity: Math.abs(quantity),
      previousQuantity,
      newQuantity,
      reason,
      reference,
      createdBy: 'demo-user',
      createdAt: new Date().toISOString()
    };

    this.stockMovements.push(movement);
    latsEventBus.emit('lats:stock.updated', { productId, variantId, quantity: newQuantity });
    
    return { ok: true, data: movement };
  }

  async getStockMovements(productId?: string): Promise<ApiResponse<StockMovement[]>> {
    let movements = [...this.stockMovements];
    if (productId) {
      movements = movements.filter(m => m.productId === productId);
    }
    return { ok: true, data: movements };
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<ApiResponse<PurchaseOrder[]>> {
    return { ok: true, data: this.purchaseOrders };
  }

  async getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    const po = this.purchaseOrders.find(p => p.id === id);
    if (!po) {
      return { ok: false, message: 'Purchase order not found' };
    }
    return { ok: true, data: po };
  }

  async createPurchaseOrder(data: PurchaseOrderFormData): Promise<ApiResponse<PurchaseOrder>> {
    const po: PurchaseOrder = {
      id: uuidv4(),
      orderNumber: `PO-${Date.now()}`,
      supplierId: data.supplierId,
      status: 'draft',
      items: data.items.map(item => ({
        id: uuidv4(),
        purchaseOrderId: '', // Will be set after PO creation
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        costPrice: item.costPrice,
        totalPrice: item.quantity * item.costPrice,
        receivedQuantity: 0,
        notes: item.notes
      })),
      totalAmount: data.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0),
      expectedDelivery: data.expectedDelivery,
      notes: data.notes,
      createdBy: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Set purchaseOrderId for items
    po.items.forEach(item => item.purchaseOrderId = po.id);

    this.purchaseOrders.push(po);
    latsEventBus.emit('lats:purchase-order.created', po);
    return { ok: true, data: po };
  }

  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrderFormData>): Promise<ApiResponse<PurchaseOrder>> {
    const index = this.purchaseOrders.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, message: 'Purchase order not found' };
    }

    this.purchaseOrders[index] = {
      ...this.purchaseOrders[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    latsEventBus.emit('lats:purchase-order.updated', this.purchaseOrders[index]);
    return { ok: true, data: this.purchaseOrders[index] };
  }

  async receivePurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    const po = this.purchaseOrders.find(p => p.id === id);
    if (!po) {
      return { ok: false, message: 'Purchase order not found' };
    }

    if (po.status === 'received') {
      return { ok: false, message: 'Purchase order already received' };
    }

    // Update stock for each item
    for (const item of po.items) {
      await this.adjustStock(
        item.productId,
        item.variantId,
        item.quantity,
        `Received from PO ${po.orderNumber}`,
        po.orderNumber
      );
      item.receivedQuantity = item.quantity;
    }

    po.status = 'received';
    po.updatedAt = new Date().toISOString();

    latsEventBus.emit('lats:purchase-order.received', po);
    return { ok: true, data: po };
  }

  async deletePurchaseOrder(id: string): Promise<ApiResponse<void>> {
    const index = this.purchaseOrders.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, message: 'Purchase order not found' };
    }
    this.purchaseOrders.splice(index, 1);
    return { ok: true };
  }

  // Spare Parts
  async getSpareParts(): Promise<ApiResponse<SparePart[]>> {
    return { ok: true, data: this.spareParts };
  }

  async getSparePart(id: string): Promise<ApiResponse<SparePart>> {
    const part = this.spareParts.find(p => p.id === id);
    if (!part) {
      return { ok: false, message: 'Spare part not found' };
    }
    return { ok: true, data: part };
  }

  async createSparePart(data: any): Promise<ApiResponse<SparePart>> {
    const part: SparePart = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.spareParts.push(part);
    latsEventBus.emit('lats:spare-part.created', part);
    return { ok: true, data: part };
  }

  async updateSparePart(id: string, data: any): Promise<ApiResponse<SparePart>> {
    const index = this.spareParts.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, message: 'Spare part not found' };
    }
    this.spareParts[index] = { ...this.spareParts[index], ...data, updatedAt: new Date().toISOString() };
    latsEventBus.emit('lats:spare-part.updated', this.spareParts[index]);
    return { ok: true, data: this.spareParts[index] };
  }

  async deleteSparePart(id: string): Promise<ApiResponse<void>> {
    const index = this.spareParts.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, message: 'Spare part not found' };
    }
    this.spareParts.splice(index, 1);
    latsEventBus.emit('lats:spare-part.deleted', { id });
    return { ok: true };
  }

  async useSparePart(data: any): Promise<ApiResponse<SparePartUsage>> {
    const part = this.spareParts.find(p => p.id === data.spare_part_id);
    if (!part) {
      return { ok: false, message: 'Spare part not found' };
    }

    if (part.quantity < data.quantity) {
      return { ok: false, message: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' };
    }

    part.quantity -= data.quantity;
    part.updatedAt = new Date().toISOString();

    const usage: SparePartUsage = {
      id: uuidv4(),
      ...data,
      usedBy: 'demo-user',
      usedAt: new Date().toISOString()
    };

    this.sparePartUsage.push(usage);
    latsEventBus.emit('lats:spare-part.used', usage);
    return { ok: true, data: usage };
  }

  async getSparePartUsage(): Promise<ApiResponse<SparePartUsage[]>> {
    return { ok: true, data: this.sparePartUsage };
  }

  // POS
  async getCart(): Promise<ApiResponse<Cart>> {
    if (!this.cart) {
      this.cart = {
        id: 'cart-1',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return { ok: true, data: this.cart };
  }

  async addToCart(data: any): Promise<ApiResponse<Cart>> {
    if (!this.cart) {
      await this.getCart();
    }

    const product = this.products.find(p => p.id === data.productId);
    if (!product) {
      return { ok: false, message: 'Product not found' };
    }

    const variant = product.variants.find(v => v.id === data.variantId);
    if (!variant) {
      return { ok: false, message: 'Variant not found' };
    }

    if (variant.quantity < data.quantity) {
      return { ok: false, message: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' };
    }

    const existingItem = this.cart!.items.find(item => 
      item.productId === data.productId && item.variantId === data.variantId
    );

    if (existingItem) {
      existingItem.quantity += data.quantity;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      const cartItem: CartItem = {
        id: uuidv4(),
        productId: data.productId,
        variantId: data.variantId,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: data.quantity,
        unitPrice: variant.sellingPrice,
        totalPrice: data.quantity * variant.sellingPrice,
        availableQuantity: variant.quantity,
        image: product.images[0]
      };
      this.cart!.items.push(cartItem);
    }

    this.updateCartTotals();
    latsEventBus.emit('lats:cart.updated', this.cart);
    return { ok: true, data: this.cart! };
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<Cart>> {
    if (!this.cart) {
      return { ok: false, message: 'Cart not found' };
    }

    const item = this.cart.items.find(i => i.id === itemId);
    if (!item) {
      return { ok: false, message: 'Item not found' };
    }

    if (quantity <= 0) {
      return this.removeFromCart(itemId);
    }

    if (item.availableQuantity < quantity) {
      return { ok: false, message: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' };
    }

    item.quantity = quantity;
    item.totalPrice = quantity * item.unitPrice;

    this.updateCartTotals();
    latsEventBus.emit('lats:cart.updated', this.cart);
    return { ok: true, data: this.cart };
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<Cart>> {
    if (!this.cart) {
      return { ok: false, message: 'Cart not found' };
    }

    const index = this.cart.items.findIndex(i => i.id === itemId);
    if (index === -1) {
      return { ok: false, message: 'Item not found' };
    }

    this.cart.items.splice(index, 1);
    this.updateCartTotals();
    latsEventBus.emit('lats:cart.updated', this.cart);
    return { ok: true, data: this.cart };
  }

  async clearCart(): Promise<ApiResponse<Cart>> {
    if (!this.cart) {
      return { ok: false, message: 'Cart not found' };
    }

    this.cart.items = [];
    this.updateCartTotals();
    latsEventBus.emit('lats:cart.updated', this.cart);
    return { ok: true, data: this.cart };
  }

  private updateCartTotals() {
    if (!this.cart) return;

    this.cart.subtotal = this.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    this.cart.total = this.cart.subtotal + this.cart.tax - this.cart.discount;
    this.cart.itemCount = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    this.cart.updatedAt = new Date().toISOString();
  }

  async processSale(data: ProcessSaleData): Promise<ApiResponse<Sale | InsufficientStockError>> {
    if (!this.cart || this.cart.items.length === 0) {
      return { ok: false, message: 'Cart is empty' };
    }

    // Check stock availability
    for (const item of this.cart.items) {
      const product = this.products.find(p => p.id === item.productId);
      const variant = product?.variants.find(v => v.id === item.variantId);
      
      if (!variant || variant.quantity < item.quantity) {
        const error: InsufficientStockError = {
          code: 'INSUFFICIENT_STOCK',
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableQuantity: variant?.quantity || 0,
          productName: item.productName,
          variantName: item.variantName
        };
        return { ok: false, data: error, code: 'INSUFFICIENT_STOCK' };
      }
    }

    // Process the sale
    const sale: Sale = {
      id: uuidv4(),
      saleNumber: `SALE-${Date.now()}`,
      items: this.cart.items.map(item => {
        const product = this.products.find(p => p.id === item.productId)!;
        const variant = product.variants.find(v => v.id === item.variantId)!;
        
        return {
          id: uuidv4(),
          saleId: '', // Will be set after sale creation
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: variant.costPrice,
          profit: item.totalPrice - (variant.costPrice * item.quantity)
        };
      }),
      subtotal: this.cart.subtotal,
      tax: this.cart.tax,
      discount: this.cart.discount,
      total: this.cart.total,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'completed',
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes,
      soldBy: 'demo-user',
      soldAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Set saleId for items
    sale.items.forEach(item => item.saleId = sale.id);

    // Update stock
    for (const item of sale.items) {
      await this.adjustStock(
        item.productId,
        item.variantId,
        -item.quantity,
        `Sale ${sale.saleNumber}`,
        sale.saleNumber
      );
    }

    this.sales.push(sale);
    await this.clearCart();
    
    latsEventBus.emit('lats:sale.completed', sale);
    return { ok: true, data: sale };
  }

  async getSales(): Promise<ApiResponse<Sale[]>> {
    return { ok: true, data: this.sales };
  }

  async getSale(id: string): Promise<ApiResponse<Sale>> {
    const sale = this.sales.find(s => s.id === id);
    if (!sale) {
      return { ok: false, message: 'Sale not found' };
    }
    return { ok: true, data: sale };
  }

  async getPOSSettings(): Promise<ApiResponse<POSSettings>> {
    return { ok: true, data: this.posSettings };
  }

  async updatePOSSettings(settings: Partial<POSSettings>): Promise<ApiResponse<POSSettings>> {
    this.posSettings = { ...this.posSettings, ...settings };
    return { ok: true, data: this.posSettings };
  }

  // Analytics
  async getInventoryStats(): Promise<ApiResponse<any>> {
    const totalProducts = this.products.length;
    const totalValue = this.products.reduce((sum, p) => sum + p.totalValue, 0);
    const lowStockItems = this.products.filter(p => 
      p.variants.some(v => v.quantity <= v.minQuantity)
    ).length;

    return {
      ok: true,
      data: {
        totalProducts,
        totalValue,
        lowStockItems,
        categories: this.categories.length,
        brands: this.brands.length,
        suppliers: this.suppliers.length
      }
    };
  }

  async getSalesStats(): Promise<ApiResponse<any>> {
    const totalSales = this.sales.length;
    const totalRevenue = this.sales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = this.sales.reduce((sum, s) => 
      sum + s.items.reduce((itemSum, item) => itemSum + item.profit, 0), 0
    );

    return {
      ok: true,
      data: {
        totalSales,
        totalRevenue,
        totalProfit,
        averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
      }
    };
  }

  async getLowStockItems(): Promise<ApiResponse<Product[]>> {
    const lowStockProducts = this.products.filter(p => 
      p.variants.some(v => v.quantity <= v.minQuantity)
    );
    return { ok: true, data: lowStockProducts };
  }

  async getSaleItems(): Promise<ApiResponse<any[]>> {
    // Return empty array for demo - this would be populated with actual sale items
    return { ok: true, data: [] };
  }
}

// Export singleton instance
const demoProvider = new DemoDataProvider();
export default demoProvider;
