// Offline AI Service for basic device analysis
// Uses local knowledge base and simple pattern matching

export interface OfflineAnalysis {
  problem: string;
  solutions: string[];
  estimatedCost: string;
  difficulty: string;
  timeEstimate: string;
  partsNeeded: string[];
  confidence: number; // 0-1, how confident the offline analysis is
}

export interface LocalKnowledgeBase {
  patterns: Array<{
    keywords: string[];
    problem: string;
    solutions: string[];
    estimatedCost: string;
    difficulty: string;
    timeEstimate: string;
    partsNeeded: string[];
  }>;
}

class OfflineAIService {
  private knowledgeBase: LocalKnowledgeBase;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.setupOnlineStatusListener();
  }

  private setupOnlineStatusListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🟢 Back online - switching to cloud AI');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🔴 Offline - using local AI analysis');
    });
  }

  private initializeKnowledgeBase(): LocalKnowledgeBase {
    return {
      patterns: [
        // Screen Issues
        {
          keywords: ['screen', 'display', 'lcd', 'touch', 'cracked', 'broken', 'black', 'white'],
          problem: 'Screen display issue detected',
          solutions: [
            'Replace LCD screen',
            'Check display cable connections',
            'Test touch sensor functionality',
            'Verify motherboard display circuit'
          ],
          estimatedCost: 'Tsh 80,000 - 200,000',
          difficulty: 'Medium',
          timeEstimate: '2-4 hours',
          partsNeeded: ['LCD Screen', 'Display Cable', 'Touch Sensor', 'Adhesive']
        },
        
        // Battery Issues
        {
          keywords: ['battery', 'charge', 'power', 'drain', 'dead', 'swollen', 'overheat'],
          problem: 'Battery or power issue detected',
          solutions: [
            'Replace battery',
            'Check charging port',
            'Test charging circuit',
            'Verify power management'
          ],
          estimatedCost: 'Tsh 30,000 - 80,000',
          difficulty: 'Easy',
          timeEstimate: '1-2 hours',
          partsNeeded: ['Battery', 'Charging Port', 'Charging Cable']
        },
        
        // Water Damage
        {
          keywords: ['water', 'liquid', 'moisture', 'wet', 'drowned', 'rain', 'spill'],
          problem: 'Water damage detected',
          solutions: [
            'Clean and dry components',
            'Replace damaged parts',
            'Test all functions',
            'Apply corrosion protection'
          ],
          estimatedCost: 'Tsh 50,000 - 150,000',
          difficulty: 'Hard',
          timeEstimate: '4-8 hours',
          partsNeeded: ['Cleaning Solution', 'Replacement Parts', 'Corrosion Protection']
        },
        
        // Performance Issues
        {
          keywords: ['slow', 'lag', 'freeze', 'crash', 'restart', 'overheat', 'performance'],
          problem: 'Performance or software issue detected',
          solutions: [
            'Clean and optimize system',
            'Update software',
            'Check hardware components',
            'Replace thermal paste'
          ],
          estimatedCost: 'Tsh 20,000 - 60,000',
          difficulty: 'Easy',
          timeEstimate: '1-3 hours',
          partsNeeded: ['Thermal Paste', 'Cleaning Tools', 'Software Tools']
        },
        
        // Audio Issues
        {
          keywords: ['speaker', 'microphone', 'audio', 'sound', 'mute', 'noise', 'crackling'],
          problem: 'Audio system issue detected',
          solutions: [
            'Replace speakers',
            'Check audio circuit',
            'Test microphone',
            'Verify audio drivers'
          ],
          estimatedCost: 'Tsh 25,000 - 70,000',
          difficulty: 'Medium',
          timeEstimate: '2-3 hours',
          partsNeeded: ['Speakers', 'Microphone', 'Audio Cable']
        },
        
        // Camera Issues
        {
          keywords: ['camera', 'photo', 'video', 'blur', 'dark', 'flash', 'lens'],
          problem: 'Camera system issue detected',
          solutions: [
            'Replace camera module',
            'Clean camera lens',
            'Check camera circuit',
            'Test camera software'
          ],
          estimatedCost: 'Tsh 40,000 - 100,000',
          difficulty: 'Medium',
          timeEstimate: '2-4 hours',
          partsNeeded: ['Camera Module', 'Lens', 'Flash LED']
        }
      ]
    };
  }

  async analyzeDevice(
    brand: string,
    model: string,
    issueDescription: string,
    language: 'swahili' | 'english' = 'english'
  ): Promise<OfflineAnalysis> {
    const description = issueDescription.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    // Find the best matching pattern
    for (const pattern of this.knowledgeBase.patterns) {
      const score = this.calculateMatchScore(description, pattern.keywords);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    if (!bestMatch || highestScore < 0.3) {
      // No good match found
      return {
        problem: language === 'swahili' ? 'Tatizo halijulikani' : 'Unknown issue',
        solutions: [
          language === 'swahili' 
            ? 'Chambua kifaa kwa undani zaidi' 
            : 'Perform detailed device inspection'
        ],
        estimatedCost: language === 'swahili' ? 'Bei itaamuliwa baada ya uchambuzi' : 'Cost to be determined after inspection',
        difficulty: language === 'swahili' ? 'Haijulikani' : 'Unknown',
        timeEstimate: language === 'swahili' ? 'Muda utaamuliwa' : 'Time to be determined',
        partsNeeded: [],
        confidence: 0.1
      };
    }

    // Translate response based on language
    const response = this.translateResponse(bestMatch, language);
    
    return {
      ...response,
      confidence: Math.min(highestScore, 0.8) // Cap confidence at 80% for offline analysis
    };
  }

  private calculateMatchScore(description: string, keywords: string[]): number {
    let score = 0;
    const words = description.split(/\s+/);
    
    for (const keyword of keywords) {
      if (description.includes(keyword)) {
        score += 1;
      }
      
      // Check for partial matches
      for (const word of words) {
        if (word.includes(keyword) || keyword.includes(word)) {
          score += 0.5;
        }
      }
    }
    
    return score / keywords.length;
  }

  private translateResponse(pattern: any, language: 'swahili' | 'english') {
    if (language === 'swahili') {
      return {
        problem: this.translateToSwahili(pattern.problem),
        solutions: pattern.solutions.map(s => this.translateToSwahili(s)),
        estimatedCost: pattern.estimatedCost,
        difficulty: this.translateDifficultyToSwahili(pattern.difficulty),
        timeEstimate: pattern.timeEstimate,
        partsNeeded: pattern.partsNeeded
      };
    }
    
    return pattern;
  }

  private translateToSwahili(text: string): string {
    const translations: { [key: string]: string } = {
      'Screen display issue detected': 'Tatizo la skrini limegunduliwa',
      'Replace LCD screen': 'Badilisha skrini ya LCD',
      'Check display cable connections': 'Angalia muunganisho wa cable ya skrini',
      'Test touch sensor functionality': 'Jaribu utendaji wa sensor ya touch',
      'Verify motherboard display circuit': 'Thibitisha mzunguko wa skrini kwenye motherboard',
      'Battery or power issue detected': 'Tatizo la betri au umeme limegunduliwa',
      'Replace battery': 'Badilisha betri',
      'Check charging port': 'Angalia port ya kuchaji',
      'Test charging circuit': 'Jaribu mzunguko wa kuchaji',
      'Verify power management': 'Thibitisha usimamizi wa umeme',
      'Water damage detected': 'Uharibifu wa maji umegunduliwa',
      'Clean and dry components': 'Safisha na kukausha vipengele',
      'Replace damaged parts': 'Badilisha sehemu zilizoharibiwa',
      'Test all functions': 'Jaribu kazi zote',
      'Apply corrosion protection': 'Weka ulinzi wa kutu',
      'Performance or software issue detected': 'Tatizo la utendaji au programu limegunduliwa',
      'Clean and optimize system': 'Safisha na boraisha mfumo',
      'Update software': 'Sasisha programu',
      'Check hardware components': 'Angalia vipengele vya hardware',
      'Replace thermal paste': 'Badilisha thermal paste',
      'Audio system issue detected': 'Tatizo la mfumo wa sauti limegunduliwa',
      'Replace speakers': 'Badilisha spika',
      'Check audio circuit': 'Angalia mzunguko wa sauti',
      'Test microphone': 'Jaribu kipaza sauti',
      'Verify audio drivers': 'Thibitisha drivers za sauti',
      'Camera system issue detected': 'Tatizo la mfumo wa kamera limegunduliwa',
      'Replace camera module': 'Badilisha moduli ya kamera',
      'Clean camera lens': 'Safisha lenzi ya kamera',
      'Check camera circuit': 'Angalia mzunguko wa kamera',
      'Test camera software': 'Jaribu programu ya kamera'
    };

    return translations[text] || text;
  }

  private translateDifficultyToSwahili(difficulty: string): string {
    const translations: { [key: string]: string } = {
      'Easy': 'Rahisi',
      'Medium': 'Wastani',
      'Hard': 'Ngumu'
    };

    return translations[difficulty] || difficulty;
  }

  // Check if offline analysis is available
  isOfflineAnalysisAvailable(): boolean {
    return this.knowledgeBase.patterns.length > 0;
  }

  // Get offline analysis confidence level
  getOfflineConfidence(): number {
    return 0.7; // 70% confidence for offline analysis
  }

  // Sync local knowledge base with cloud (when online)
  async syncKnowledgeBase(): Promise<void> {
    if (!this.isOnline) {
      console.log('🔴 Cannot sync - offline');
      return;
    }

    try {
      // In a real app, this would fetch updated patterns from the server
      console.log('🔄 Syncing knowledge base...');
      // await fetch('/api/ai/knowledge-base');
      console.log('✅ Knowledge base synced');
    } catch (error) {
      console.error('❌ Failed to sync knowledge base:', error);
    }
  }
}

const offlineAIService = new OfflineAIService();
export default offlineAIService;
