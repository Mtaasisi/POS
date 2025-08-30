// Internationalization utility for LATS module
export interface TranslationKey {
  [key: string]: string;
}

export interface Translations {
  [locale: string]: TranslationKey;
}

// Default translations for English
const DEFAULT_TRANSLATIONS: TranslationKey = {
  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.clear': 'Clear',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.warning': 'Warning',
  'common.info': 'Info',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.ok': 'OK',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.submit': 'Submit',
  'common.reset': 'Reset',
  'common.refresh': 'Refresh',
  'common.export': 'Export',
  'common.import': 'Import',
  'common.download': 'Download',
  'common.upload': 'Upload',
  'common.print': 'Print',
  'common.copy': 'Copy',
  'common.paste': 'Paste',
  'common.select': 'Select',
  'common.selectAll': 'Select All',
  'common.deselectAll': 'Deselect All',
  'common.actions': 'Actions',
  'common.status': 'Status',
  'common.date': 'Date',
  'common.time': 'Time',
  'common.quantity': 'Quantity',
  'common.price': 'Price',
  'common.total': 'Total',
  'common.subtotal': 'Subtotal',
  'common.tax': 'Tax',
  'common.discount': 'Discount',
  'common.amount': 'Amount',
  'common.currency': 'Currency',
  'common.percentage': 'Percentage',
  'common.unit': 'Unit',
  'common.units': 'Units',
  'common.item': 'Item',
  'common.items': 'Items',
  'common.product': 'Product',
  'common.products': 'Products',
  'common.category': 'Category',
  'common.categories': 'Categories',

  'common.supplier': 'Supplier',
  'common.suppliers': 'Suppliers',
  'common.customer': 'Customer',
  'common.customers': 'Customers',
  'common.order': 'Order',
  'common.orders': 'Orders',
  'common.sale': 'Sale',
  'common.sales': 'Sales',
  'common.invoice': 'Invoice',
  'common.invoices': 'Invoices',
  'common.receipt': 'Receipt',
  'common.receipts': 'Receipts',
  'common.payment': 'Payment',
  'common.payments': 'Payments',
  'common.stock': 'Stock',
  'common.inventory': 'Inventory',
  'common.warehouse': 'Warehouse',
  'common.warehouses': 'Warehouses',
  'common.location': 'Location',
  'common.locations': 'Locations',
  'common.sku': 'SKU',
  'common.barcode': 'Barcode',
  'common.description': 'Description',
  'common.notes': 'Notes',
  'common.remarks': 'Remarks',
  'common.reason': 'Reason',
  'common.reference': 'Reference',
  'common.created': 'Created',
  'common.updated': 'Updated',
  'common.createdBy': 'Created By',
  'common.updatedBy': 'Updated By',
  'common.createdAt': 'Created At',
  'common.updatedAt': 'Updated At',
  'common.active': 'Active',
  'common.inactive': 'Inactive',
  'common.enabled': 'Enabled',
  'common.disabled': 'Disabled',
  'common.visible': 'Visible',
  'common.hidden': 'Hidden',
  'common.public': 'Public',
  'common.private': 'Private',
  'common.draft': 'Draft',
  'common.published': 'Published',
  'common.archived': 'Archived',
  'common.deleted': 'Deleted',
  'common.pending': 'Pending',
  'common.approved': 'Approved',
  'common.rejected': 'Rejected',
  'common.completed': 'Completed',
  'common.cancelled': 'Cancelled',
  'common.failed': 'Failed',
  'common.successful': 'Successful',
  'common.unsuccessful': 'Unsuccessful',
  'common.available': 'Available',
  'common.unavailable': 'Unavailable',
  'common.inStock': 'In Stock',
  'common.outOfStock': 'Out of Stock',
  'common.lowStock': 'Low Stock',
  'common.overStock': 'Over Stock',
  'common.zeroStock': 'Zero Stock',
  'common.negativeStock': 'Negative Stock',
  'common.positiveStock': 'Positive Stock',
  'common.stockLevel': 'Stock Level',
  'common.minimumStock': 'Minimum Stock',
  'common.maximumStock': 'Maximum Stock',
  'common.reorderPoint': 'Reorder Point',
  'common.reorderQuantity': 'Reorder Quantity',
  'common.leadTime': 'Lead Time',
  'common.supplierLeadTime': 'Supplier Lead Time',
  'common.customerLeadTime': 'Customer Lead Time',
  'common.processingTime': 'Processing Time',
  'common.deliveryTime': 'Delivery Time',
  'common.shippingTime': 'Shipping Time',
  'common.returnTime': 'Return Time',
  'common.refundTime': 'Refund Time',
  'common.exchangeTime': 'Exchange Time',
  'common.warrantyTime': 'Warranty Time',
  'common.guaranteeTime': 'Guarantee Time',
  'common.expiryTime': 'Expiry Time',
  'common.validityTime': 'Validity Time',
  'common.effectiveTime': 'Effective Time',
  'common.expirationTime': 'Expiration Time',
  'common.startTime': 'Start Time',
  'common.endTime': 'End Time',
  'common.beginTime': 'Begin Time',
  'common.finishTime': 'Finish Time',
  'common.openTime': 'Open Time',
  'common.closeTime': 'Close Time',
  'common.businessHours': 'Business Hours',
  'common.workingHours': 'Working Hours',
  'common.officeHours': 'Office Hours',
  'common.storeHours': 'Store Hours',
  'common.serviceHours': 'Service Hours',
  'common.supportHours': 'Support Hours',
  'common.helpHours': 'Help Hours',
  'common.contactHours': 'Contact Hours',
  'common.availability': 'Availability',
  'common.availableFrom': 'Available From',
  'common.availableTo': 'Available To',
  'common.availableUntil': 'Available Until',
  'common.availableSince': 'Available Since',
  'common.availableFor': 'Available For',
  'common.availableIn': 'Available In',
  'common.availableAt': 'Available At',
  'common.availableOn': 'Available On',
  'common.availableBy': 'Available By',
  'common.availableThrough': 'Available Through',
  'common.availableVia': 'Available Via',
  'common.availableWith': 'Available With',
  'common.availableWithout': 'Available Without',
  'common.availableWithin': 'Available Within',
  'common.availableOutside': 'Available Outside',
  'common.availableInside': 'Available Inside',
  'common.availableAbove': 'Available Above',
  'common.availableBelow': 'Available Below',
  'common.availableBefore': 'Available Before',
  'common.availableAfter': 'Available After',
  'common.availableDuring': 'Available During',
  'common.availableBetween': 'Available Between',
  'common.availableAmong': 'Available Among',
  'common.availableAmongst': 'Available Amongst',
  'common.availableAcross': 'Available Across',
  'common.availableAlong': 'Available Along',
  'common.availableAround': 'Available Around',
  'common.availableAbout': 'Available About',
  'common.availableAgainst': 'Available Against',
  'common.availableAlongside': 'Available Alongside',
  'common.availableAmid': 'Available Amid',
  'common.availableAmidst': 'Available Amidst',
  'common.availableAs': 'Available As',
  'common.availableBehind': 'Available Behind',
  'common.availableBeneath': 'Available Beneath',
  'common.availableBeside': 'Available Beside',
  'common.availableBesides': 'Available Besides',
  'common.availableBeyond': 'Available Beyond',
  'common.availableConcerning': 'Available Concerning',
  'common.availableConsidering': 'Available Considering',
  'common.availableDespite': 'Available Despite',
  'common.availableDown': 'Available Down',
  'common.availableExcept': 'Available Except',
  'common.availableInto': 'Available Into',
  'common.availableLike': 'Available Like',
  'common.availableMinus': 'Available Minus',
  'common.availableNear': 'Available Near',
  'common.availableOf': 'Available Of',
  'common.availableOff': 'Available Off',
  'common.availableOnto': 'Available Onto',
  'common.availableOut': 'Available Out',
  'common.availableOver': 'Available Over',
  'common.availablePast': 'Available Past',
  'common.availablePer': 'Available Per',
  'common.availablePlus': 'Available Plus',
  'common.availableRegarding': 'Available Regarding',
  'common.availableRound': 'Available Round',
  'common.availableSave': 'Available Save',
  'common.availableThan': 'Available Than',
  'common.availableThroughout': 'Available Throughout',
  'common.availableToward': 'Available Toward',
  'common.availableTowards': 'Available Towards',
  'common.availableUnder': 'Available Under',
  'common.availableUnderneath': 'Available Underneath',
  'common.availableUnlike': 'Available Unlike',
  'common.availableUp': 'Available Up',
  'common.availableUpon': 'Available Upon',
  'common.availableVersus': 'Available Versus',
  'common.availableWorth': 'Available Worth'
};

// Swahili translations
const SWAHILI_TRANSLATIONS: TranslationKey = {
  // Common
  'common.save': 'Hifadhi',
  'common.cancel': 'Ghairi',
  'common.delete': 'Futa',
  'common.edit': 'Hariri',
  'common.add': 'Ongeza',
  'common.search': 'Tafuta',
  'common.filter': 'Chuja',
  'common.clear': 'Futa',
  'common.loading': 'Inapakia...',
  'common.error': 'Hitilafu',
  'common.success': 'Mafanikio',
  'common.warning': 'Onyo',
  'common.info': 'Maelezo',
  'common.yes': 'Ndiyo',
  'common.no': 'Hapana',
  'common.ok': 'Sawa',
  'common.close': 'Funga',
  'common.back': 'Rudi',
  'common.next': 'Ifuatayo',
  'common.previous': 'Iliyotangulia',
  'common.submit': 'Wasilisha',
  'common.reset': 'Weka upya',
  'common.refresh': 'Onyesha upya',
  'common.export': 'Hamisha nje',
  'common.import': 'Hamisha ndani',
  'common.download': 'Pakua',
  'common.upload': 'Pakia',
  'common.print': 'Chapa',
  'common.copy': 'Nakili',
  'common.paste': 'Bandika',
  'common.select': 'Chagua',
  'common.selectAll': 'Chagua Zote',
  'common.deselectAll': 'Ondoa Uchaguzi Zote',
  'common.actions': 'Vitendo',
  'common.status': 'Hali',
  'common.date': 'Tarehe',
  'common.time': 'Muda',
  'common.quantity': 'Kiasi',
  'common.price': 'Bei',
  'common.total': 'Jumla',
  'common.subtotal': 'Jumla ndogo',
  'common.tax': 'Kodi',
  'common.discount': 'Punguzo',
  'common.amount': 'Kiasi',
  'common.currency': 'Sarafu',
  'common.percentage': 'Asilimia',
  'common.unit': 'Kimoja',
  'common.units': 'Vimoja',
  'common.item': 'Kipengele',
  'common.items': 'Vipengele',
  'common.product': 'Bidhaa',
  'common.products': 'Bidhaa',
  'common.category': 'Kategoria',
  'common.categories': 'Kategoria',

  'common.supplier': 'Mtoaji',
  'common.suppliers': 'Watoaji',
  'common.customer': 'Mteja',
  'common.customers': 'Wateja',
  'common.order': 'Oda',
  'common.orders': 'Oda',
  'common.sale': 'Uuzaji',
  'common.sales': 'Uuzaji',
  'common.invoice': 'Fakturi',
  'common.invoices': 'Fakturi',
  'common.receipt': 'Risiti',
  'common.receipts': 'Risiti',
  'common.payment': 'Malipo',
  'common.payments': 'Malipo',
  'common.stock': 'Hifadhi',
  'common.inventory': 'Orodha ya bidhaa',
  'common.warehouse': 'Ghala',
  'common.warehouses': 'Maghala',
  'common.location': 'Mahali',
  'common.locations': 'Mahali',
  'common.sku': 'SKU',
  'common.barcode': 'Msimbo wa mstari',
  'common.description': 'Maelezo',
  'common.notes': 'Maelezo',
  'common.remarks': 'Maoni',
  'common.reason': 'Sababu',
  'common.reference': 'Marejeleo',
  'common.created': 'Iliundwa',
  'common.updated': 'Iliyosasishwa',
  'common.createdBy': 'Iliundwa na',
  'common.updatedBy': 'Iliyosasishwa na',
  'common.createdAt': 'Iliundwa saa',
  'common.updatedAt': 'Iliyosasishwa saa',
  'common.active': 'Inatumika',
  'common.inactive': 'Haifanyi kazi',
  'common.enabled': 'Imeamilishwa',
  'common.disabled': 'Imezuiwa',
  'common.visible': 'Inaonekana',
  'common.hidden': 'Imejificha',
  'common.public': 'Ya umma',
  'common.private': 'Ya kibinafsi',
  'common.draft': 'Rasimu',
  'common.published': 'Imechapishwa',
  'common.archived': 'Imehifadhiwa',
  'common.deleted': 'Imeondolewa',
  'common.pending': 'Inasubiri',
  'common.approved': 'Imekubaliwa',
  'common.rejected': 'Imekataliwa',
  'common.completed': 'Imekamilika',
  'common.cancelled': 'Imeghairiwa',
  'common.failed': 'Imeshindwa',
  'common.successful': 'Imefanikiwa',
  'common.unsuccessful': 'Haijafanikiwa',
  'common.available': 'Inapatikana',
  'common.unavailable': 'Haipatikani',
  'common.inStock': 'Iko kwenye hifadhi',
  'common.outOfStock': 'Haiko kwenye hifadhi',
  'common.lowStock': 'Hifadhi ndogo',
  'common.overStock': 'Hifadhi kubwa',
  'common.zeroStock': 'Hifadhi sifuri',
  'common.negativeStock': 'Hifadhi hasi',
  'common.positiveStock': 'Hifadhi chanya',
  'common.stockLevel': 'Kiwango cha hifadhi',
  'common.minimumStock': 'Hifadhi ya chini',
  'common.maximumStock': 'Hifadhi ya juu',
  'common.reorderPoint': 'Hatua ya kuagiza tena',
  'common.reorderQuantity': 'Kiasi cha kuagiza tena',
  'common.leadTime': 'Muda wa kuongoza',
  'common.supplierLeadTime': 'Muda wa kuongoza wa mtoaji',
  'common.customerLeadTime': 'Muda wa kuongoza wa mteja',
  'common.processingTime': 'Muda wa kusindika',
  'common.deliveryTime': 'Muda wa kusambaza',
  'common.shippingTime': 'Muda wa kusafirisha',
  'common.returnTime': 'Muda wa kurudi',
  'common.refundTime': 'Muda wa kurudisha pesa',
  'common.exchangeTime': 'Muda wa kubadilisha',
  'common.warrantyTime': 'Muda wa dhamana',
  'common.guaranteeTime': 'Muda wa uhakikisho',
  'common.expiryTime': 'Muda wa kumalizika',
  'common.validityTime': 'Muda wa uhalali',
  'common.effectiveTime': 'Muda wa kufanya kazi',
  'common.expirationTime': 'Muda wa kumalizika',
  'common.startTime': 'Muda wa kuanza',
  'common.endTime': 'Muda wa kumaliza',
  'common.beginTime': 'Muda wa kuanza',
  'common.finishTime': 'Muda wa kumaliza',
  'common.openTime': 'Muda wa kufungua',
  'common.closeTime': 'Muda wa kufunga',
  'common.businessHours': 'Masaa ya biashara',
  'common.workingHours': 'Masaa ya kufanya kazi',
  'common.officeHours': 'Masaa ya ofisi',
  'common.storeHours': 'Masaa ya duka',
  'common.serviceHours': 'Masaa ya huduma',
  'common.supportHours': 'Masaa ya msaada',
  'common.helpHours': 'Masaa ya msaada',
  'common.contactHours': 'Masaa ya mawasiliano',
  'common.availability': 'Upatikanaji',
  'common.availableFrom': 'Inapatikana kutoka',
  'common.availableTo': 'Inapatikana hadi',
  'common.availableUntil': 'Inapatikana hadi',
  'common.availableSince': 'Inapatikana tangu',
  'common.availableFor': 'Inapatikana kwa',
  'common.availableIn': 'Inapatikana katika',
  'common.availableAt': 'Inapatikana saa',
  'common.availableOn': 'Inapatikana kwenye',
  'common.availableBy': 'Inapatikana na',
  'common.availableThrough': 'Inapatikana kupitia',
  'common.availableVia': 'Inapatikana kupitia',
  'common.availableWith': 'Inapatikana na',
  'common.availableWithout': 'Inapatikana bila',
  'common.availableWithin': 'Inapatikana ndani ya',
  'common.availableOutside': 'Inapatikana nje ya',
  'common.availableInside': 'Inapatikana ndani ya',
  'common.availableAbove': 'Inapatikana juu ya',
  'common.availableBelow': 'Inapatikana chini ya',
  'common.availableBefore': 'Inapatikana kabla ya',
  'common.availableAfter': 'Inapatikana baada ya',
  'common.availableDuring': 'Inapatikana wakati wa',
  'common.availableBetween': 'Inapatikana kati ya',
  'common.availableAmong': 'Inapatikana miongoni mwa',
  'common.availableAmongst': 'Inapatikana miongoni mwa',
  'common.availableAcross': 'Inapatikana kote',
  'common.availableAlong': 'Inapatikana pamoja na',
  'common.availableAround': 'Inapatikana karibu na',
  'common.availableAbout': 'Inapatikana kuhusu',
  'common.availableAgainst': 'Inapatikana dhidi ya',
  'common.availableAlongside': 'Inapatikana pamoja na',
  'common.availableAmid': 'Inapatikana kati ya',
  'common.availableAmidst': 'Inapatikana kati ya',
  'common.availableAs': 'Inapatikana kama',
  'common.availableBehind': 'Inapatikana nyuma ya',
  'common.availableBeneath': 'Inapatikana chini ya',
  'common.availableBeside': 'Inapatikana kando ya',
  'common.availableBesides': 'Inapatikana kando ya',
  'common.availableBeyond': 'Inapatikana zaidi ya',
  'common.availableConcerning': 'Inapatikana kuhusu',
  'common.availableConsidering': 'Inapatikana kwa kuzingatia',
  'common.availableDespite': 'Inapatikana licha ya',
  'common.availableDown': 'Inapatikana chini',
  'common.availableExcept': 'Inapatikana isipokuwa',
  'common.availableInto': 'Inapatikana ndani ya',
  'common.availableLike': 'Inapatikana kama',
  'common.availableMinus': 'Inapatikana toa',
  'common.availableNear': 'Inapatikana karibu na',
  'common.availableOf': 'Inapatikana ya',
  'common.availableOff': 'Inapatikana mbali na',
  'common.availableOnto': 'Inapatikana kwenye',
  'common.availableOut': 'Inapatikana nje',
  'common.availableOver': 'Inapatikana juu ya',
  'common.availablePast': 'Inapatikana zaidi ya',
  'common.availablePer': 'Inapatikana kwa',
  'common.availablePlus': 'Inapatikana pamoja na',
  'common.availableRegarding': 'Inapatikana kuhusu',
  'common.availableRound': 'Inapatikana kuzunguka',
  'common.availableSave': 'Inapatikana isipokuwa',
  'common.availableThan': 'Inapatikana kuliko',
  'common.availableThroughout': 'Inapatikana kote',
  'common.availableToward': 'Inapatikana kuelekea',
  'common.availableTowards': 'Inapatikana kuelekea',
  'common.availableUnder': 'Inapatikana chini ya',
  'common.availableUnderneath': 'Inapatikana chini ya',
  'common.availableUnlike': 'Inapatikana tofauti na',
  'common.availableUp': 'Inapatikana juu',
  'common.availableUpon': 'Inapatikana juu ya',
  'common.availableVersus': 'Inapatikana dhidi ya',
  'common.availableWorth': 'Inapatikana thamani ya'
};

// All translations
const TRANSLATIONS: Translations = {
  'en': DEFAULT_TRANSLATIONS,
  'sw': SWAHILI_TRANSLATIONS
};

// Current locale
let currentLocale = 'en';

/**
 * Set the current locale
 */
export function setLocale(locale: string) {
  currentLocale = locale;
}

/**
 * Get the current locale
 */
export function getLocale(): string {
  return currentLocale;
}

/**
 * Get available locales
 */
export function getAvailableLocales(): string[] {
  return Object.keys(TRANSLATIONS);
}

/**
 * Add custom translations
 */
export function addTranslations(locale: string, translations: TranslationKey) {
  if (!TRANSLATIONS[locale]) {
    TRANSLATIONS[locale] = {};
  }
  TRANSLATIONS[locale] = { ...TRANSLATIONS[locale], ...translations };
}

/**
 * Translate a key
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const locale = currentLocale;
  const translations = TRANSLATIONS[locale] || TRANSLATIONS['en'];
  let translation = translations[key] || key;

  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(value));
    });
  }

  return translation;
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(key: string): boolean {
  const locale = currentLocale;
  const translations = TRANSLATIONS[locale] || TRANSLATIONS['en'];
  return key in translations;
}

/**
 * Get all translations for current locale
 */
export function getAllTranslations(): TranslationKey {
  const locale = currentLocale;
  return TRANSLATIONS[locale] || TRANSLATIONS['en'];
}

/**
 * Get translation for specific locale
 */
export function tForLocale(key: string, locale: string, params?: Record<string, string | number>): string {
  const translations = TRANSLATIONS[locale] || TRANSLATIONS['en'];
  let translation = translations[key] || key;

  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(value));
    });
  }

  return translation;
}
