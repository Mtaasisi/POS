// Shared utility for intelligent column detection across all import modals

export interface ColumnMapping {
  name: string[];
  phone: string[];
  whatsapp: string[];
  gender: string[];
  city: string[];
  notes: string[];
  loyaltyLevel: string[];
  colorTag: string[];
  birthMonth: string[];
  birthDay: string[];
  referralSource: string[];
  referralSourceCustom: string[];
  locationDescription: string[];
  nationalId: string[];
  referredBy: string[];
  totalSpent: string[];
  points: string[];
  isActive: string[];
  profileImage: string[];
  birthday: string[];
  email: string[];
  id: string[];
}

// Comprehensive column mapping for all possible field variations
export const createColumnMapping = (): ColumnMapping => ({
  name: ['name', 'full name', 'customer name', 'first name', 'client name', 'customer', 'client', 'fullname', 'firstname', 'lastname', 'first name', 'last name', 'fullname', 'customer full name', 'client full name', 'person name', 'contact name'],
  phone: ['phone', 'phone number', 'mobile', 'mobile phone', 'primary phone', 'phone 1 - value', 'contact', 'contact number', 'telephone', 'tel', 'cell', 'cell phone', 'mobile number', 'phone number', 'contact phone', 'primary contact', 'phone contact', 'mobile contact', 'telephone number'],
  whatsapp: ['whatsapp', 'whatsapp number', 'whats app', 'whatsapp phone', 'wa', 'whatsapp contact', 'whatsapp number', 'whatsapp contact', 'whats app number', 'whatsapp mobile', 'wa number', 'wa contact'],
  gender: ['gender', 'sex', 'male/female', 'm/f', 'gender identity', 'male or female', 'm or f', 'gender type', 'sex type'],
  city: ['city', 'location', 'home city', 'business city', 'town', 'address', 'residence', 'home town', 'business town', 'home location', 'business location', 'home address', 'business address', 'city location', 'town location'],
  notes: ['notes', 'comments', 'remarks', 'description', 'details', 'additional info', 'extra info', 'customer notes', 'client notes', 'additional notes', 'extra notes', 'remarks notes', 'description notes', 'initial notes'],
  loyaltyLevel: ['loyalty', 'loyalty level', 'level', 'customer level', 'tier', 'membership level', 'loyalty tier', 'customer tier', 'membership tier', 'loyalty status', 'customer status', 'level status'],
  colorTag: ['color tag', 'tag', 'customer tag', 'status tag', 'priority', 'category', 'type', 'customer type', 'client type', 'priority tag', 'category tag', 'status type'],
  birthMonth: ['birth month', 'month', 'birthday month', 'month of birth', 'dob month', 'birth month', 'month of birth', 'birthday month', 'birth month number', 'month number'],
  birthDay: ['birth day', 'day', 'birthday day', 'day of birth', 'dob day', 'birth date', 'birth day', 'day of birth', 'birthday day', 'birth day number', 'day number'],
  referralSource: ['referral source', 'referral', 'referred by', 'referral resource', 'how did you hear', 'source', 'referrer source', 'how did you hear about us', 'how did you find us', 'referral method', 'referral type', 'referral source type'],
  referralSourceCustom: ['referral source custom', 'custom referral', 'other referral', 'custom source', 'other referral source', 'custom referral source', 'other source'],
  locationDescription: ['location description', 'address', 'home address', 'business address', 'street address', 'full address', 'detailed address', 'home location', 'business location', 'street location', 'full location', 'detailed location'],
  nationalId: ['national id', 'id number', 'national id number', 'identity number', 'id card', 'passport number', 'national id number', 'identity card', 'id card number', 'passport id', 'national identity', 'identity card number'],
  referredBy: ['referred by', 'referrer', 'who referred', 'referred by name', 'referrer name', 'who referred you', 'referred by person', 'referrer person', 'who referred customer'],
  totalSpent: ['total spent', 'spent', 'total amount', 'amount spent', 'total purchase', 'total value', 'total amount spent', 'total purchase amount', 'total value spent', 'customer spent', 'client spent'],
  points: ['points', 'loyalty points', 'reward points', 'customer points', 'bonus points', 'loyalty reward points', 'customer reward points', 'bonus reward points', 'points earned', 'points accumulated'],
  isActive: ['is active', 'active', 'status', 'customer status', 'active status', 'customer active', 'client active', 'active customer', 'active client', 'customer is active', 'client is active'],
  profileImage: ['profile image', 'image', 'photo', 'picture', 'avatar', 'profile picture', 'customer image', 'client image', 'profile photo', 'customer photo', 'client photo', 'profile avatar'],
  birthday: ['birthday', 'birth day', 'birth', 'birth date', 'date of birth', 'dob', 'birth date', 'birthday date', 'date of birth', 'birthday day', 'birth day date'],
  email: ['email', 'e-mail', 'email address', 'e-mail address', 'customer email', 'client email', 'contact email'],
  id: ['id', 'customer id', 'client id', 'customer id number', 'client id number', 'record id', 'unique id', 'identifier']
});

// Enhanced column detection function with fuzzy matching
export const detectColumns = (headers: string[], columnMapping: ColumnMapping): {[key: string]: number} => {
  const detected: {[key: string]: number} = {};
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' '));
  
  // For each field type, find the best matching column
  Object.entries(columnMapping).forEach(([fieldType, possibleNames]) => {
    let bestMatch = -1;
    let bestScore = 0;
    
    normalizedHeaders.forEach((header, index) => {
      possibleNames.forEach(possibleName => {
        // Exact match gets highest score
        if (header === possibleName) {
          if (bestScore < 100) {
            bestScore = 100;
            bestMatch = index;
          }
        }
        // Contains match gets medium score
        else if (header.includes(possibleName) || possibleName.includes(header)) {
          const score = Math.min(header.length, possibleName.length) / Math.max(header.length, possibleName.length) * 80;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = index;
          }
        }
        // Partial match gets lower score
        else {
          const words = possibleName.split(' ');
          const headerWords = header.split(' ');
          let matchCount = 0;
          
          words.forEach(word => {
            if (word.length > 2 && headerWords.some(hw => hw.includes(word) || word.includes(hw))) {
              matchCount++;
            }
          });
          
          if (matchCount > 0) {
            const score = (matchCount / words.length) * 60;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = index;
            }
          }
        }
        
        // Additional fuzzy matching for common variations
        if (bestScore < 40) {
          // Handle common abbreviations and variations
          const variations = {
            'name': ['nm', 'n', 'full nm', 'customer nm'],
            'phone': ['ph', 'p', 'tel', 'mobile', 'mob', 'cell'],
            'whatsapp': ['wa', 'whats', 'whats app'],
            'gender': ['sex', 'g', 'm/f', 'male/female'],
            'city': ['location', 'loc', 'town', 'address'],
            'notes': ['comment', 'cmt', 'remark', 'desc'],
            'loyalty': ['loyal', 'level', 'tier', 'status'],
            'birth': ['dob', 'birthday', 'birth day'],
            'referral': ['ref', 'referred', 'source'],
            'total': ['amount', 'sum', 'spent', 'value'],
            'points': ['pts', 'reward', 'bonus'],
            'active': ['status', 'is active', 'customer status'],
            'image': ['photo', 'pic', 'picture', 'avatar'],
            'email': ['e-mail', 'mail', 'contact email'],
            'id': ['customer id', 'client id', 'record id']
          };
          
          const fieldVariations = variations[fieldType as keyof typeof variations] || [];
          fieldVariations.forEach(variation => {
            if (header.includes(variation) || variation.includes(header)) {
              const score = 50; // Medium-high score for variations
              if (score > bestScore) {
                bestScore = score;
                bestMatch = index;
              }
            }
          });
        }
      });
    });
    
    if (bestMatch !== -1) {
      detected[fieldType] = bestMatch;
    }
  });
  
  return detected;
};

// Enhanced value extraction function
export const extractValue = (values: string[], fieldType: string, detectedColumns: {[key: string]: number}): string => {
  const columnIndex = detectedColumns[fieldType];
  if (columnIndex !== undefined && columnIndex >= 0 && columnIndex < values.length) {
    return values[columnIndex] || '';
  }
  return '';
};

// Process CSV/Excel file with intelligent column detection
export const processFileWithIntelligentDetection = async (
  file: File,
  columnMapping: ColumnMapping,
  onProgress?: (message: string) => void
): Promise<{
  data: any[];
  detectedColumns: {[key: string]: number};
  errors: string[];
  headers: string[];
}> => {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }
    
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    const detectedColumns = detectColumns(headers, columnMapping);
    
    // Show detected column mapping to user
    const detectedFields = Object.keys(detectedColumns);
    const detectedCount = detectedFields.length;
    const totalFields = Object.keys(columnMapping).length;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Detected columns:', detectedColumns);
      console.log('Original headers:', headers);
    }
    
    if (onProgress) {
      if (detectedCount > 0) {
        onProgress(`Intelligently detected ${detectedCount}/${totalFields} columns automatically!`);
      } else {
        onProgress('Could not automatically detect column positions. Please check your file format.');
      }
    }
    
    const data: any[] = [];
    const errors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // Use intelligent column detection to extract values
      const rowData: any = {};
      
      Object.keys(columnMapping).forEach(fieldType => {
        rowData[fieldType] = extractValue(values, fieldType, detectedColumns);
      });
      
      data.push(rowData);
    }
    
    return {
      data,
      detectedColumns,
      errors,
      headers
    };
    
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}; 