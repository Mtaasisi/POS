// Gemini AI Service for Clean App
// Alternative to OpenAI with generous free tier

export interface GeminiResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface GeminiConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

class GeminiService {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';
  private config: GeminiConfig = {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 1000
  };

  constructor() {
    // Initialize with environment variable
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  // Test connection
  async testConnection(): Promise<GeminiResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.config.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello! Please respond with 'Connection successful' if you can read this message."
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          success: true,
          data: data.candidates[0].content.parts[0].text
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Connection test failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`
      };
    }
  }

  // Generic chat function
  async chat(messages: Array<{ role: 'user' | 'assistant', content: string }>): Promise<GeminiResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      // Convert messages to Gemini format
      const contents = messages.map(msg => ({
        parts: [{ text: msg.content }],
        role: msg.role === 'user' ? 'user' : 'model'
      }));

      const response = await fetch(`${this.baseUrl}/${this.config.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          success: true,
          data: data.candidates[0].content.parts[0].text
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'AI request failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`
      };
    }
  }

  // Customer service AI
  async generateCustomerResponse(customerQuery: string, context?: string): Promise<GeminiResponse> {
    const systemPrompt = `You are a helpful customer service assistant for a device repair and sales business. 
    Provide professional, friendly responses that are concise and helpful. 
    Focus on device repair, sales, and customer satisfaction.`;

    const fullPrompt = context 
      ? `${systemPrompt}\n\nContext: ${context}\n\nCustomer query: "${customerQuery}"`
      : `${systemPrompt}\n\nCustomer query: "${customerQuery}"`;

    return this.chat([{ role: 'user', content: fullPrompt }]);
  }

  // Device diagnostics AI
  async diagnoseDeviceIssue(symptoms: string, deviceType: string): Promise<GeminiResponse> {
    const prompt = `As a device repair technician, analyze these symptoms and provide a diagnosis:
    
Device Type: ${deviceType}
Symptoms: ${symptoms}

Please provide:
1. Likely cause
2. Recommended repair steps
3. Estimated repair time
4. Potential cost range
5. Safety warnings

Keep response concise and professional.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  // SMS/WhatsApp response generation
  async generateSMSResponse(message: string, context?: string): Promise<GeminiResponse> {
    const prompt = `Generate a professional SMS/WhatsApp response for a device repair business:

Customer Message: "${message}"
${context ? `Context: ${context}` : ''}

Requirements:
- Professional and friendly tone
- Concise (under 160 characters if possible)
- Address customer's concern
- Include next steps if needed
- No technical jargon unless necessary`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  // Finance analysis
  async analyzeExpense(description: string, amount: number): Promise<GeminiResponse> {
    const prompt = `Analyze this business expense for a device repair shop:

Description: ${description}
Amount: $${amount}

Please provide:
1. Expense category (e.g., Parts, Labor, Utilities, Marketing, etc.)
2. Business impact analysis
3. Cost optimization suggestions
4. Tax implications (if any)

Keep response concise and practical.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }
}

const geminiService = new GeminiService();
export default geminiService; 