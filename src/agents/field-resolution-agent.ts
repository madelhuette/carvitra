/**
 * LangGraph Field Resolution Agent
 * 
 * Autonomer Agent der "denken", recherchieren und Formularfelder intelligent lösen kann.
 * Nutzt LangGraph für State Management und Chain-of-Thought Reasoning.
 */

import { StateGraph, Annotation, Command, START, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver } from "@langchain/langgraph";
import { 
  FieldRequest, 
  FieldContext, 
  AgentThought, 
  ResearchResult, 
  FieldResolution,
  AgentNextStep,
  AgentResponse,
  AgentConfig
} from './types';

// LangGraph State Annotation
const FieldAgentStateAnnotation = Annotation.Root({
  // Input
  fieldRequest: Annotation<FieldRequest>(),
  context: Annotation<FieldContext>(),
  
  // Agent's "Gedankenprozess" 
  thoughts: Annotation<AgentThought[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // Forschungsergebnisse
  researchResults: Annotation<ResearchResult[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // Zwischenergebnisse
  extractionAttempts: Annotation<Array<{
    source: string
    result: any
    confidence: number
  }>>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // Navigation
  nextStep: Annotation<AgentNextStep>({
    reducer: (x, y) => y ?? x,
    default: () => 'extractFromContext' as AgentNextStep,
  }),
  
  retryCount: Annotation<number>({
    reducer: (x, y) => Math.max(x || 0, y || 0),
    default: () => 0,
  }),
  
  // Output
  resolution: Annotation<FieldResolution>(),
  
  // Error Handling
  errors: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export class FieldResolutionAgent {
  private llm: ChatAnthropic;
  private config: AgentConfig;
  private agent: any; // StateGraph instance
  
  constructor(config: AgentConfig) {
    this.config = config;
    this.llm = new ChatAnthropic({ 
      model: "claude-sonnet-4-20250514", // Claude Sonnet 4 - Aktuelles Modell (Mai 2025)
      apiKey: config.anthropicApiKey,
      temperature: 0.3 // Erhöht für mehr Kreativität bei der Feldextraktion
    });
    
    this.buildAgent();
  }

  /**
   * Hauptmethode: Löse ein Feld intelligent
   */
  async resolveField(
    fieldRequest: FieldRequest, 
    context: FieldContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // KRITISCH: LangGraph braucht thread_id für MemorySaver
      const threadId = `field-resolution-${fieldRequest.fieldName}-${Date.now()}`;
      
      const result = await this.agent.invoke({
        fieldRequest,
        context,
      }, {
        configurable: {
          thread_id: threadId
        }
      });
      
      return {
        success: true,
        resolution: result.resolution,
        thoughts: result.thoughts,
        researchPerformed: result.researchResults.length > 0,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        thoughts: [],
        researchPerformed: false,
        processingTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Erstelle den LangGraph Agent mit 5 autonomen Nodes
   */
  private buildAgent() {
    const workflow = new StateGraph(FieldAgentStateAnnotation)
      // Die 5 "Denkschritte" des Agenten
      .addNode("analyze", this.analyzeRequest.bind(this))
      .addNode("extractFromContext", this.extractFromContext.bind(this))
      .addNode("performResearch", this.performResearch.bind(this))
      .addNode("synthesize", this.synthesize.bind(this))
      .addNode("validate", this.validate.bind(this))
      
      // Workflow Definition
      .addEdge(START, "analyze")
      .addConditionalEdges("analyze", this.routeAfterAnalyze.bind(this))
      .addConditionalEdges("extractFromContext", this.routeAfterExtract.bind(this))
      .addEdge("performResearch", "synthesize")
      .addConditionalEdges("synthesize", this.routeAfterSynthesize.bind(this))
      .addConditionalEdges("validate", this.routeAfterValidate.bind(this));

    this.agent = workflow.compile({
      checkpointer: new MemorySaver(), // Für State Persistence
    });
  }

  // ===============================
  // NODE 1: ANALYSE - "Was wird gefragt?"
  // ===============================
  private async analyzeRequest(state: typeof FieldAgentStateAnnotation.State) {
    if (this.config.debug) {
      console.log('🧠 Agent analyzing request:', state.fieldRequest.fieldName);
    }
    
    const analysisPrompt = this.buildAnalysisPrompt(state.fieldRequest, state.context);
    
    try {
      const response = await this.llm.invoke(analysisPrompt);
      
      const thought: AgentThought = {
        step: 'analyze',
        reasoning: response.content as string,
        timestamp: new Date()
      };
      
      return {
        thoughts: [thought]
      };
    } catch (error) {
      return {
        errors: [`Analysis failed: ${error}`],
        nextStep: '__end__' as AgentNextStep
      };
    }
  }

  // ===============================
  // NODE 2: EXTRAKTION - "Kann ich es aus vorhandenen Daten lösen?"
  // ===============================
  private async extractFromContext(state: typeof FieldAgentStateAnnotation.State) {
    if (this.config.debug) {
      console.log('🔍 Agent extracting from context...');
    }
    
    const extractionAttempts = [];
    
    // 1. Versuche aus AI-extrahierten Daten
    if (state.context.extractedData) {
      const aiResult = this.tryExtractFromAI(state.fieldRequest, state.context.extractedData);
      if (aiResult) {
        extractionAttempts.push({
          source: 'ai_extraction',
          result: aiResult.value,
          confidence: aiResult.confidence
        });
      }
    }
    
    // 2. Versuche aus Enrichment-Daten
    if (state.context.enrichedData) {
      const enrichResult = this.tryExtractFromEnrichment(state.fieldRequest, state.context.enrichedData);
      if (enrichResult) {
        extractionAttempts.push({
          source: 'enrichment',
          result: enrichResult.value,
          confidence: enrichResult.confidence
        });
      }
    }
    
    // 3. Pattern Matching VOLLSTÄNDIG ENTFERNT - Agent nutzt KI statt Pattern
    
    // Finde beste Extraktion
    const bestExtraction = extractionAttempts
      .sort((a, b) => b.confidence - a.confidence)[0];
    
    // Bei Select-Feldern: Auch niedrige Konfidenz akzeptieren (min 20%)
    const isSelectField = state.fieldRequest.constraints?.enumOptions?.length > 0;
    const minConfidence = isSelectField ? 20 : this.config.minConfidenceThreshold;
    
    if (bestExtraction && bestExtraction.confidence >= minConfidence) {
      // Genug Konfidenz - direkt zu Validation
      const resolution: FieldResolution = {
        value: bestExtraction.result,
        confidence: bestExtraction.confidence,
        reasoning: `Extracted from ${bestExtraction.source}`,
        sources: [bestExtraction.source]
      };
      
      return {
        extractionAttempts,
        resolution,
        nextStep: 'validate' as AgentNextStep
      };
    }
    
    // Nicht genug Konfidenz - Recherche nötig
    const thought: AgentThought = {
      step: 'extractFromContext',
      reasoning: `Best extraction confidence: ${bestExtraction?.confidence || 0}. Need research.`,
      timestamp: new Date(),
      confidence: bestExtraction?.confidence || 0
    };
    
    return {
      extractionAttempts,
      thoughts: [thought],
      nextStep: this.config.enablePerplexityResearch ? 'performResearch' : 'synthesize'
    };
  }

  // ===============================
  // NODE 3: RECHERCHE - "Hole zusätzliche Infos"
  // ===============================
  private async performResearch(state: typeof FieldAgentStateAnnotation.State) {
    if (this.config.debug) {
      console.log('🔬 Agent performing autonomous research...');
    }
    
    try {
      // Erstelle intelligente Recherche-Query
      const researchQuery = await this.buildResearchQuery(state);
      
      // Führe Perplexity-Recherche durch
      const researchResult = await this.executePerplexityResearch(researchQuery, state.context);
      
      const thought: AgentThought = {
        step: 'performResearch',
        reasoning: `Researched: "${researchQuery}" - Found relevant data`,
        timestamp: new Date(),
        confidence: researchResult.confidence
      };
      
      return {
        researchResults: [researchResult],
        thoughts: [thought]
      };
    } catch (error) {
      const thought: AgentThought = {
        step: 'performResearch',
        reasoning: `Research failed: ${error}`,
        timestamp: new Date(),
        confidence: 0
      };
      
      return {
        thoughts: [thought],
        errors: [`Research failed: ${error}`]
      };
    }
  }

  // ===============================
  // NODE 4: SYNTHESE - "Kombiniere alle Infos zur Antwort"
  // ===============================
  private async synthesize(state: typeof FieldAgentStateAnnotation.State) {
    if (this.config.debug) {
      console.log('🧮 Agent synthesizing final answer...');
    }
    
    const synthesisPrompt = this.buildSynthesisPrompt(state);
    
    try {
      const response = await this.llm.invoke(synthesisPrompt);
      const resolution = this.parseSynthesisResponse(response.content as string, state.fieldRequest);
      
      const thought: AgentThought = {
        step: 'synthesize',
        reasoning: `Synthesized answer: ${resolution.value} (${resolution.confidence}% confidence)`,
        timestamp: new Date(),
        confidence: resolution.confidence
      };
      
      return {
        resolution,
        thoughts: [thought],
        nextStep: 'validate' as AgentNextStep
      };
    } catch (error) {
      return {
        errors: [`Synthesis failed: ${error}`],
        nextStep: '__end__' as AgentNextStep
      };
    }
  }

  // ===============================
  // NODE 5: VALIDIERUNG - "Passt die Antwort?"
  // ===============================
  private async validate(state: typeof FieldAgentStateAnnotation.State) {
    if (this.config.debug) {
      console.log('✅ Agent validating answer...');
    }
    
    if (!state.resolution) {
      return {
        errors: ['No resolution to validate'],
        nextStep: '__end__' as AgentNextStep
      };
    }
    
    const validationResult = this.validateAgainstConstraints(
      state.resolution.value,
      state.fieldRequest.constraints
    );
    
    if (validationResult.isValid) {
      const thought: AgentThought = {
        step: 'validate',
        reasoning: `Validation successful: ${validationResult.reason}`,
        timestamp: new Date(),
        confidence: state.resolution.confidence
      };
      
      return {
        thoughts: [thought],
        nextStep: '__end__' as AgentNextStep
      };
    }
    
    // Validation fehlgeschlagen
    if (state.retryCount < this.config.maxRetries) {
      const thought: AgentThought = {
        step: 'validate',
        reasoning: `Validation failed: ${validationResult.reason}. Retrying...`,
        timestamp: new Date(),
        confidence: 0
      };
      
      return {
        thoughts: [thought],
        retryCount: state.retryCount + 1,
        nextStep: 'synthesize' as AgentNextStep // Retry synthesis
      };
    }
    
    // Max retries erreicht
    return {
      errors: [`Validation failed after ${this.config.maxRetries} retries: ${validationResult.reason}`],
      nextStep: '__end__' as AgentNextStep
    };
  }

  // ===============================
  // ROUTING FUNCTIONS (Conditional Edges)
  // ===============================
  
  private routeAfterAnalyze(state: typeof FieldAgentStateAnnotation.State): AgentNextStep {
    return 'extractFromContext';
  }
  
  private routeAfterExtract(state: typeof FieldAgentStateAnnotation.State): AgentNextStep {
    return state.nextStep || 'synthesize';
  }
  
  private routeAfterSynthesize(state: typeof FieldAgentStateAnnotation.State): AgentNextStep {
    return state.nextStep || 'validate';
  }
  
  private routeAfterValidate(state: typeof FieldAgentStateAnnotation.State): AgentNextStep {
    return state.nextStep || '__end__';
  }

  // ===============================
  // HELPER METHODS
  // ===============================
  
  private buildAnalysisPrompt(fieldRequest: FieldRequest, context: FieldContext): string {
    const vehicleInfo = context.extractedData ? 
      `Fahrzeug: ${context.extractedData.make || ''} ${context.extractedData.model || ''}`.trim() : 
      'Unbekanntes Fahrzeug';
    
    return `Du bist ein Experte für Fahrzeugdaten-Extraktion. Analysiere diese Anfrage:

FELD: ${fieldRequest.fieldName}
TYP: ${fieldRequest.fieldType}
CONSTRAINTS: ${JSON.stringify(fieldRequest.constraints)}
${vehicleInfo ? `FAHRZEUG: ${vehicleInfo}` : ''}

VERFÜGBARER KONTEXT:
- PDF Text: ${context.pdfText ? 'Vorhanden' : 'Nicht vorhanden'}
- Extrahierte Daten: ${context.extractedData ? 'Vorhanden' : 'Nicht vorhanden'}  
- Enrichment Daten: ${context.enrichedData ? 'Vorhanden' : 'Nicht vorhanden'}

WICHTIGE HINWEISE für Karosserie-Typ:
- T-Cross, T-Roc, Taigo sind CROSSOVER (kompakte Stadt-SUVs)
- Tiguan, Touareg sind echte SUVs (größer)
- Bei Unsicherheit zwischen Crossover und SUV: Kompakte Modelle sind meist Crossover

Analysiere Schritt für Schritt:
1. Was genau wird gesucht?
2. Welche Datenquellen könnten relevant sein?
3. Welche Herausforderungen siehst du?

Antwort in 2-3 Sätzen:`;
  }

  private tryExtractFromAI(fieldRequest: FieldRequest, extractedData: any): {value: any, confidence: number} | null {
    // Versuche direkten Match
    if (extractedData[fieldRequest.fieldName]) {
      return {
        value: extractedData[fieldRequest.fieldName],
        confidence: 85
      };
    }
    
    // Versuche ähnliche Felder
    const fieldMap: Record<string, string[]> = {
      'vehicle_type': ['body_style', 'category', 'type'],
      'make': ['brand', 'manufacturer'],
      'model': ['model_name', 'series'],
      'fuel_type': ['fuel', 'kraftstoff'],
      'power_ps': ['power', 'ps', 'horsepower'],
      'power_kw': ['power_kw', 'kw', 'kilowatt'],
    };
    
    const alternativeFields = fieldMap[fieldRequest.fieldName] || [];
    
    for (const altField of alternativeFields) {
      if (extractedData[altField]) {
        return {
          value: extractedData[altField],
          confidence: 75
        };
      }
    }
    
    return null;
  }

  private tryExtractFromEnrichment(fieldRequest: FieldRequest, enrichedData: any): {value: any, confidence: number} | null {
    if (!enrichedData?.vehicle) return null;
    
    const vehicle = enrichedData.vehicle;
    
    switch (fieldRequest.fieldName) {
      case 'vehicle_type':
        if (vehicle.body_style) return { value: vehicle.body_style, confidence: 80 };
        break;
      case 'fuel_type':
        if (vehicle.fuel_type) return { value: vehicle.fuel_type, confidence: 90 };
        break;
      case 'power_ps':
        if (vehicle.power_ps) return { value: vehicle.power_ps, confidence: 95 };
        break;
      case 'power_kw':
        if (vehicle.power_kw) return { value: vehicle.power_kw, confidence: 95 };
        break;
    }
    
    return null;
  }

  // REMOVED: tryPatternMatching - All pattern matching has been removed in favor of AI-based resolution

  private async buildResearchQuery(state: typeof FieldAgentStateAnnotation.State): Promise<string> {
    // Versuche Fahrzeugdaten aus verschiedenen Quellen zu holen (mit formData Fallback)
    const make = state.context.extractedData?.make || 
                 state.context.enrichedData?.vehicle?.make || 
                 state.context.currentFormData?.make || '';
    const model = state.context.extractedData?.model || 
                  state.context.enrichedData?.vehicle?.model || 
                  state.context.currentFormData?.model || '';
    const variant = state.context.extractedData?.variant || 
                    state.context.extractedData?.trim || 
                    state.context.currentFormData?.trim || '';
    const year = state.context.extractedData?.year || 
                 state.context.enrichedData?.vehicle?.year || 
                 state.context.currentFormData?.year || '';
    
    // Build vehicle identifier - mindestens Marke sollte verfügbar sein
    let vehicleId = '';
    if (make && model) {
      vehicleId = `${make} ${model}`;
      if (variant) vehicleId += ` ${variant}`;
      if (year) vehicleId += ` ${year}`;
    } else if (make) {
      vehicleId = make;
    } else {
      vehicleId = 'unbekanntes Fahrzeug';
    }
    
    // Field-specific queries with context
    switch (state.fieldRequest.fieldName) {
      case 'vehicle_type':
      case 'body_style':
        return `Was ist der genaue Karosserie-Typ von ${vehicleId}? Ist es ein Crossover (kompaktes Stadt-SUV wie T-Cross, T-Roc), SUV (größer wie Tiguan), Kompaktwagen, Limousine, Kombi, Kleinwagen, Cabrio oder Coupé? WICHTIG: T-Cross und T-Roc sind Crossover, nicht SUV!`;
        
      case 'fuel_type':
        return `Welcher Kraftstoff wird vom ${vehicleId} verwendet? Benzin, Diesel, Elektro, Hybrid oder andere?`;
        
      case 'power_ps':
      case 'power_kw':
        return `Wie viel Leistung hat der Motor vom ${vehicleId}? Angabe in PS und kW.`;
        
      case 'displacement':
        return `Welchen Hubraum hat der ${vehicleId}? Angabe in Liter oder ccm.`;
        
      case 'transmission_type':
        return `Welches Getriebe hat der ${vehicleId}? Schaltgetriebe, Automatik, DSG oder andere?`;
        
      case 'cylinders':
        return `Wie viele Zylinder hat der Motor vom ${vehicleId}?`;
        
      case 'co2_emissions':
        return `Wie hoch sind die CO₂-Emissionen vom ${vehicleId}? Angabe in g/km.`;
        
      case 'emission_class':
        return `Welche Energieeffizienzklasse hat der ${vehicleId}? Angabe als Klasse A (sehr effizient) bis G (wenig effizient) nach PKW-EnVKV.`;
        
      case 'fuel_consumption_combined':
        return `Wie hoch ist der Kraftstoffverbrauch vom ${vehicleId}? Kombinierter Verbrauch in l/100km oder kWh/100km.`;
        
      case 'acceleration_0_100':
        return `Wie schnell beschleunigt der ${vehicleId} von 0-100 km/h? Angabe in Sekunden.`;
        
      case 'top_speed':
        return `Welche Höchstgeschwindigkeit erreicht der ${vehicleId}? Angabe in km/h.`;
        
      case 'weight_empty':
        return `Wie schwer ist das Leergewicht vom ${vehicleId}? Angabe in kg.`;
        
      default:
        // Generic query for unknown fields
        return `Welche technischen Daten gibt es zum ${state.fieldRequest.fieldName} vom ${vehicleId}?`;
    }
  }

  private async executePerplexityResearch(query: string, context: FieldContext): Promise<ResearchResult> {
    try {
      if (this.config.debug) {
        console.log('🔬 LangGraph Agent executing Perplexity research:', query);
      }
      
      // Dynamischer Import zur Laufzeit (vermeidet SSR-Probleme)
      const { PerplexityEnrichmentService } = await import('@/services/perplexity-enrichment.service');
      
      const perplexityService = new PerplexityEnrichmentService(
        this.config.perplexityApiKey || process.env.PERPLEXITY_API_KEY || '',
        null // Kein Supabase nötig für reine Suche
      );

      const searchResult = await perplexityService.searchVehicleInfo(query, {
        make: context.extractedData?.make || context.enrichedData?.vehicle?.make,
        model: context.extractedData?.model || context.enrichedData?.vehicle?.model,
        variant: context.extractedData?.variant || context.extractedData?.trim,
        year: context.extractedData?.year || context.enrichedData?.vehicle?.year
      });

      if (this.config.debug) {
        console.log('🎯 Perplexity result:', {
          confidence: searchResult.confidence,
          sources: searchResult.sources.length,
          tokens: searchResult.tokens_used
        });
      }

      return {
        source: 'perplexity',
        query,
        result: searchResult.result,
        confidence: searchResult.confidence,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Perplexity research failed:', error);
      
      // Fallback: Return low-confidence mock result
      return {
        source: 'perplexity',
        query,
        result: `Research unavailable: ${error}`,
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  private buildSynthesisPrompt(state: typeof FieldAgentStateAnnotation.State): string {
    const constraints = state.fieldRequest.constraints;
    const constraintsText = constraints?.enumOptions?.length ? 
      `Wähle aus: ${constraints.enumOptions.join(', ')}` : 
      `Gib einen ${state.fieldRequest.fieldType} Wert zurück`;

    return `Bestimme den plausibelsten Wert für "${state.fieldRequest.fieldName}" basierend auf verfügbaren Informationen:

VERFÜGBARE INFORMATIONEN:
${state.thoughts.map(t => `- ${t.step}: ${t.reasoning}`).join('\n')}

EXTRAKTIONSVERSUCHE:
${state.extractionAttempts.map(e => `- ${e.source}: ${e.result} (${e.confidence}%)`).join('\n')}

FORSCHUNGSERGEBNISSE:
${state.researchResults.map(r => `- Recherche "${r.query}": ${r.result}`).join('\n')}

REGELN:
- Bei Enum-Feldern mit required=true: Du MUSST IMMER eine Option wählen!
- Leere Auswahl (null) ist bei Select-Feldern VERBOTEN
- Wenn unsicher: Wähle die wahrscheinlichste Option (selbst bei 10% Konfidenz)
- Bei totaler Unsicherheit: Wähle die häufigste/neutralste Option
- Für Karosserie-Typ bei Unsicherheit: "SUV" oder "Limousine" (häufigste Typen)
- Für Kraftstoffart bei Unsicherheit: "Benzin" (häufigster Typ)
- NIEMALS 'UNKNOWN' oder erfundene Werte verwenden
- Bei Enum-Feldern: ${constraintsText}

KRITISCH für Select-Felder (enumOptions vorhanden):
Du MUSST einen Wert aus den gegebenen Optionen wählen!
Null, leer oder "keine Auswahl" ist VERBOTEN!
Besser eine falsche Auswahl als keine Auswahl!

Antwort im Format:
WERT: [deine beste Einschätzung - NIEMALS null bei Select-Feldern!]
KONFIDENZ: [0-100]
BEGRÜNDUNG: [kurze Erklärung warum dieser Wert plausibel ist]`;
  }

  private parseSynthesisResponse(response: string, fieldRequest: FieldRequest): FieldResolution {
    const lines = response.split('\n');
    let value: any = null;
    let confidence = 50;
    let reasoning = 'AI synthesis';
    
    for (const line of lines) {
      if (line.startsWith('WERT:')) {
        value = line.replace('WERT:', '').trim();
      } else if (line.startsWith('KONFIDENZ:')) {
        confidence = parseInt(line.replace('KONFIDENZ:', '').trim()) || 50;
      } else if (line.startsWith('BEGRÜNDUNG:')) {
        reasoning = line.replace('BEGRÜNDUNG:', '').trim();
      }
    }
    
    // Bei Select-Feldern mit required: Fallback auf erste Option wenn null
    if ((value === null || value === 'null') && 
        fieldRequest.constraints?.required && 
        fieldRequest.constraints?.enumOptions?.length > 0) {
      console.warn(`Agent returned null for required enum field ${fieldRequest.fieldName}, using first option as fallback`);
      value = fieldRequest.constraints.enumOptions[0];
      confidence = 10; // Sehr niedrige Konfidenz für Fallback
      reasoning = 'Fallback to first available option';
    }
    
    // Type conversion
    if (fieldRequest.fieldType === 'number' && value) {
      value = parseFloat(value);
    } else if (fieldRequest.fieldType === 'boolean' && value) {
      value = ['true', 'ja', 'yes', '1'].includes(value.toLowerCase());
    }
    
    return {
      value,
      confidence,
      reasoning,
      sources: ['ai_synthesis']
    };
  }

  private validateAgainstConstraints(value: any, constraints?: FieldRequest['constraints']): {isValid: boolean, reason: string} {
    if (!constraints) return { isValid: true, reason: 'No constraints to validate' };
    
    // Null/undefined-Check: Bei required + enumOptions -> NIEMALS leer!
    if (value === null || value === undefined || value === '') {
      if (constraints.required && constraints.enumOptions && constraints.enumOptions.length > 0) {
        // Bei Select-Feldern mit Optionen: Wähle erste Option als Fallback
        console.warn('Required enum field is empty - this should never happen!')
        return { isValid: false, reason: 'Required select field MUST have a value' };
      }
      if (constraints.required) {
        return { isValid: false, reason: 'Required field is empty' };
      }
      return { isValid: true, reason: 'Empty value allowed for non-required field' };
    }
    
    // Enum check - NUR wenn enumOptions definiert UND nicht leer
    if (constraints.enumOptions && constraints.enumOptions.length > 0) {
      if (!constraints.enumOptions.includes(value)) {
        return { isValid: false, reason: `Value "${value}" not in allowed options: ${constraints.enumOptions.join(', ')}` };
      }
    }
    
    // Number checks
    if (typeof value === 'number') {
      if (constraints.min !== undefined && value < constraints.min) {
        return { isValid: false, reason: `Value ${value} below minimum ${constraints.min}` };
      }
      if (constraints.max !== undefined && value > constraints.max) {
        return { isValid: false, reason: `Value ${value} above maximum ${constraints.max}` };
      }
    }
    
    // Pattern check
    if (constraints.pattern && typeof value === 'string' && !constraints.pattern.test(value)) {
      return { isValid: false, reason: `Value "${value}" does not match required pattern` };
    }
    
    return { isValid: true, reason: 'All constraints satisfied' };
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Factory function für einfache Verwendung
export function createFieldResolutionAgent(config: Partial<AgentConfig> = {}): FieldResolutionAgent {
  const defaultConfig: AgentConfig = {
    maxRetries: 2,
    minConfidenceThreshold: 70,
    enablePerplexityResearch: true,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    perplexityApiKey: process.env.PERPLEXITY_API_KEY,
    debug: process.env.NODE_ENV === 'development'
  };
  
  return new FieldResolutionAgent({ ...defaultConfig, ...config });
}