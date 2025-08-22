/**
 * Equipment Extraction Agent mit LangGraph
 * 
 * Intelligenter Agent zur Extraktion und Kategorisierung von Fahrzeug-Ausstattungsmerkmalen
 * mit 6-Node-Architektur für maximale Präzision
 */

import { StateGraph, Annotation, START, END } from "@langchain/langgraph"
import { ChatAnthropic } from "@langchain/anthropic"
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/logger'
import { PerplexityEnrichmentService } from '@/services/perplexity-enrichment.service'
import {
  EquipmentCategory,
  EquipmentFeature,
  EquipmentMapping,
  EquipmentItem,
  EquipmentExtractionRequest,
  EquipmentExtractionResult,
  EquipmentAgentThought,
  EquipmentResearchResult,
  EquipmentSource,
  CONFIDENCE_THRESHOLDS,
  CATEGORY_KEYWORDS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_TRANSLATIONS
} from './equipment-types'

const logger = createLogger('EquipmentExtractionAgent')

// LangGraph State für Equipment-Extraction
const EquipmentAgentStateAnnotation = Annotation.Root({
  // Input
  request: Annotation<EquipmentExtractionRequest>(),
  
  // Processing State
  extractedKeywords: Annotation<string[]>({
    reducer: (x, y) => [...new Set([...x, ...y])], // Deduplizieren
    default: () => [],
  }),
  
  identifiedFeatures: Annotation<EquipmentFeature[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  categorizedFeatures: Annotation<Map<EquipmentCategory, EquipmentFeature[]>>({
    reducer: (x, y) => y ?? x,
    default: () => new Map(),
  }),
  
  researchResults: Annotation<EquipmentResearchResult[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  databaseMappings: Annotation<EquipmentMapping[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  customEquipment: Annotation<string[]>({
    reducer: (x, y) => [...new Set([...x, ...y])],
    default: () => [],
  }),
  
  // Agent Thoughts
  thoughts: Annotation<EquipmentAgentThought[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // Navigation
  currentStep: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => 'analyze',
  }),
  
  // Output
  result: Annotation<EquipmentExtractionResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  
  // Error Handling
  errors: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
})

type EquipmentAgentState = typeof EquipmentAgentStateAnnotation.State

export class EquipmentExtractionAgent {
  private llm: ChatAnthropic
  private agent: any // StateGraph instance
  private supabase: ReturnType<typeof createClient>
  private perplexityService: PerplexityEnrichmentService
  
  constructor() {
    this.llm = new ChatAnthropic({
      model: "claude-3-5-sonnet-20241022", // Aktuelles verfügbares Modell
      apiKey: process.env.ANTHROPIC_API_KEY!,
      temperature: 0.3 // Niedrig für konsistente Extraktion
    })
    
    this.supabase = createClient()
    this.perplexityService = new PerplexityEnrichmentService()
    
    this.buildAgent()
  }
  
  /**
   * Baut den LangGraph-Agenten mit 6 Nodes
   */
  private buildAgent() {
    const workflow = new StateGraph(EquipmentAgentStateAnnotation)
    
    // Node 1: ANALYZE - Verstehe PDF-Text und Context
    workflow.addNode("analyze", async (state: EquipmentAgentState) => {
      logger.info("🔍 Node 1: ANALYZE - Analysiere PDF-Text")
      
      const thought: EquipmentAgentThought = {
        step: "analyze",
        thought: "Analysiere PDF-Text und extrahiere Fahrzeugkontext",
        confidence: 100,
        timestamp: new Date()
      }
      
      return {
        thoughts: [thought],
        currentStep: "extract_keywords"
      }
    })
    
    // Node 2: EXTRACT_KEYWORDS - Identifiziere Equipment-Keywords
    workflow.addNode("extract_keywords", async (state: EquipmentAgentState) => {
      logger.info("🔎 Node 2: EXTRACT_KEYWORDS - Extrahiere Equipment-Keywords")
      
      const { pdfText, extractedData, enrichedData } = state.request.context
      
      // KI-Extraktion von Equipment-Keywords
      const prompt = `
Analysiere folgenden Fahrzeug-Text und extrahiere ALLE Ausstattungsmerkmale.
Achte besonders auf: Sicherheit, Komfort, Assistenzsysteme, Infotainment, Performance, Exterieur, Interieur.

TEXT:
${pdfText.substring(0, 3000)}

${extractedData?.ai_extracted ? `
BEREITS EXTRAHIERTE DATEN:
${JSON.stringify(extractedData.ai_extracted, null, 2)}
` : ''}

${enrichedData ? `
ANGEREICHERTE DATEN:
${JSON.stringify(enrichedData, null, 2)}
` : ''}

Extrahiere eine Liste von Ausstattungsmerkmalen. 
Gib NUR ein JSON-Array mit Equipment-Namen zurück, z.B.:
["Navigationssystem", "LED-Scheinwerfer", "Sitzheizung", "Parkassistent"]

WICHTIG: 
- Nutze deutsche Bezeichnungen
- Keine Duplikate
- Nur konkrete Ausstattung, keine allgemeinen Begriffe
- Mindestens 5, maximal 30 Items
`
      
      try {
        const response = await this.llm.invoke(prompt)
        const content = response.content.toString()
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        
        if (jsonMatch) {
          const keywords = JSON.parse(jsonMatch[0]) as string[]
          
          // Erstelle Features aus Keywords
          const features: EquipmentFeature[] = keywords.map(keyword => ({
            keyword,
            confidence: 85, // KI-extrahiert
            source: 'ai_extraction' as EquipmentSource,
            reasoning: 'Aus PDF-Text von KI extrahiert'
          }))
          
          logger.info(`✅ ${keywords.length} Equipment-Keywords extrahiert`)
          
          return {
            extractedKeywords: keywords,
            identifiedFeatures: features,
            thoughts: [{
              step: "extract_keywords",
              thought: `${keywords.length} Ausstattungsmerkmale aus PDF extrahiert`,
              confidence: 85,
              timestamp: new Date(),
              data: keywords
            }],
            currentStep: "categorize"
          }
        }
      } catch (error) {
        logger.error("Fehler bei Keyword-Extraktion:", error)
      }
      
      // Fallback: Pattern-basierte Extraktion
      const fallbackKeywords = this.extractKeywordsByPattern(pdfText)
      
      return {
        extractedKeywords: fallbackKeywords,
        identifiedFeatures: fallbackKeywords.map(k => ({
          keyword: k,
          confidence: 70,
          source: 'pattern_matching' as EquipmentSource,
          reasoning: 'Durch Pattern-Matching erkannt'
        })),
        currentStep: "categorize"
      }
    })
    
    // Node 3: CATEGORIZE - Ordne Features in Kategorien ein
    workflow.addNode("categorize", async (state: EquipmentAgentState) => {
      logger.info("📂 Node 3: CATEGORIZE - Kategorisiere Equipment")
      
      const categorized = new Map<EquipmentCategory, EquipmentFeature[]>()
      
      // Initialisiere alle Kategorien
      const categories: EquipmentCategory[] = ['safety', 'comfort', 'assistance', 'infotainment', 'performance', 'exterior', 'interior', 'lighting', 'other']
      categories.forEach(cat => categorized.set(cat, []))
      
      // KI-basierte Kategorisierung
      for (const feature of state.identifiedFeatures) {
        const category = await this.categorizeFeature(feature.keyword)
        const features = categorized.get(category) || []
        features.push({
          ...feature,
          category
        })
        categorized.set(category, features)
      }
      
      // Log Kategorisierung
      categorized.forEach((features, category) => {
        if (features.length > 0) {
          logger.info(`📁 ${category}: ${features.length} Items`)
        }
      })
      
      return {
        categorizedFeatures: categorized,
        thoughts: [{
          step: "categorize",
          thought: `Equipment in ${categorized.size} Kategorien eingeteilt`,
          confidence: 90,
          timestamp: new Date(),
          data: Array.from(categorized.entries()).map(([cat, items]) => ({
            category: cat,
            count: items.length
          }))
        }],
        currentStep: state.request.options?.enablePerplexity ? "research" : "map_to_database"
      }
    })
    
    // Node 4: RESEARCH - Perplexity-Recherche für unklare Features
    workflow.addNode("research", async (state: EquipmentAgentState) => {
      logger.info("🔬 Node 4: RESEARCH - Perplexity-Recherche")
      
      const { vehicleInfo } = state.request.context
      
      if (!vehicleInfo?.make || !vehicleInfo?.model) {
        return { currentStep: "map_to_database" }
      }
      
      // Recherchiere nur Features mit niedriger Konfidenz
      const lowConfidenceFeatures = state.identifiedFeatures.filter(
        f => f.confidence < CONFIDENCE_THRESHOLDS.SUGGEST
      )
      
      if (lowConfidenceFeatures.length === 0) {
        return { currentStep: "map_to_database" }
      }
      
      try {
        const query = `Welche Ausstattungsmerkmale hat der ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.variant || ''} standardmäßig und optional? Fokus auf: ${lowConfidenceFeatures.map(f => f.keyword).join(', ')}`
        
        const researchResult = await this.perplexityService.search(query)
        
        // Parse Research-Ergebnisse für zusätzliche Equipment-Keywords
        const additionalKeywords = this.parseResearchForEquipment(researchResult)
        
        const researchRecord: EquipmentResearchResult = {
          query,
          result: researchResult,
          equipmentFound: additionalKeywords,
          confidence: 85,
          source: 'perplexity',
          timestamp: new Date()
        }
        
        // Erstelle neue Features aus Research
        const researchFeatures: EquipmentFeature[] = additionalKeywords.map(keyword => ({
          keyword,
          confidence: 85,
          source: 'perplexity_research' as EquipmentSource,
          reasoning: 'Durch Web-Recherche bestätigt'
        }))
        
        logger.info(`🔬 ${additionalKeywords.length} zusätzliche Features durch Recherche gefunden`)
        
        return {
          identifiedFeatures: researchFeatures,
          researchResults: [researchRecord],
          thoughts: [{
            step: "research",
            thought: `Web-Recherche: ${additionalKeywords.length} zusätzliche Features gefunden`,
            confidence: 85,
            timestamp: new Date(),
            data: additionalKeywords
          }],
          currentStep: "map_to_database"
        }
      } catch (error) {
        logger.error("Perplexity-Recherche fehlgeschlagen:", error)
        return { currentStep: "map_to_database" }
      }
    })
    
    // Node 5: MAP_TO_DATABASE - Mappe zu Equipment-IDs
    workflow.addNode("map_to_database", async (state: EquipmentAgentState) => {
      logger.info("🗄️ Node 5: MAP_TO_DATABASE - Mappe zu Datenbank")
      
      const mappings: EquipmentMapping[] = []
      const unmappedItems: string[] = []
      
      // Sammle alle Features
      const allFeatures: EquipmentFeature[] = []
      state.categorizedFeatures.forEach(features => {
        allFeatures.push(...features)
      })
      
      // Mappe jedes Feature zur Datenbank
      for (const feature of allFeatures) {
        const mapping = await this.mapFeatureToDatabase(feature)
        
        if (mapping) {
          mappings.push(mapping)
        } else {
          // Nicht gemappt = Custom Equipment
          unmappedItems.push(feature.keyword)
        }
      }
      
      logger.info(`✅ ${mappings.length} Equipment-Items gemappt, ${unmappedItems.length} custom`)
      
      return {
        databaseMappings: mappings,
        customEquipment: unmappedItems,
        thoughts: [{
          step: "map_to_database",
          thought: `${mappings.length} Items in DB gefunden, ${unmappedItems.length} neue Items`,
          confidence: 95,
          timestamp: new Date()
        }],
        currentStep: unmappedItems.length > 0 ? "create_custom" : "finalize"
      }
    })
    
    // Node 6: CREATE_CUSTOM - Erstelle neue Equipment-Einträge
    workflow.addNode("create_custom", async (state: EquipmentAgentState) => {
      logger.info("➕ Node 6: CREATE_CUSTOM - Erstelle Custom Equipment")
      
      if (!state.request.options?.includeCustomEquipment) {
        return { currentStep: "finalize" }
      }
      
      const createdMappings: EquipmentMapping[] = []
      
      for (const customItem of state.customEquipment) {
        // Bestimme Kategorie für neues Item
        const category = await this.categorizeFeature(customItem)
        
        // Hier würden wir normalerweise in die DB schreiben
        // Für jetzt erstellen wir nur das Mapping-Objekt
        const mapping: EquipmentMapping = {
          equipmentId: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          equipmentName: customItem,
          category,
          confidence: 70,
          source: 'ai_inferred',
          isNewItem: true
        }
        
        createdMappings.push(mapping)
      }
      
      logger.info(`➕ ${createdMappings.length} Custom Equipment-Items erstellt`)
      
      return {
        databaseMappings: createdMappings,
        thoughts: [{
          step: "create_custom",
          thought: `${createdMappings.length} neue Equipment-Items erstellt`,
          confidence: 70,
          timestamp: new Date(),
          data: createdMappings.map(m => m.equipmentName)
        }],
        currentStep: "finalize"
      }
    })
    
    // Node 7: FINALIZE - Erstelle finales Ergebnis
    workflow.addNode("finalize", async (state: EquipmentAgentState) => {
      logger.info("✅ Node 7: FINALIZE - Erstelle Ergebnis")
      
      // Gruppiere Mappings nach Kategorie
      const categorizedMappings = new Map<EquipmentCategory, EquipmentMapping[]>()
      const categories: EquipmentCategory[] = ['safety', 'comfort', 'assistance', 'infotainment', 'performance', 'exterior', 'interior', 'lighting', 'other']
      categories.forEach(cat => categorizedMappings.set(cat, []))
      
      state.databaseMappings.forEach(mapping => {
        const items = categorizedMappings.get(mapping.category) || []
        items.push(mapping)
        categorizedMappings.set(mapping.category, items)
      })
      
      // Berechne Konfidenz-Scores
      const overallConfidence = state.databaseMappings.length > 0
        ? Math.round(state.databaseMappings.reduce((sum, m) => sum + m.confidence, 0) / state.databaseMappings.length)
        : 0
        
      const byCategory: Record<EquipmentCategory, number> = {} as any
      categorizedMappings.forEach((mappings, category) => {
        byCategory[category] = mappings.length > 0
          ? Math.round(mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length)
          : 0
      })
      
      // Sammle verwendete Sources
      const sources = [...new Set(state.databaseMappings.map(m => m.source))] as EquipmentSource[]
      
      const result: EquipmentExtractionResult = {
        mappedEquipment: state.databaseMappings,
        customEquipment: state.customEquipment,
        categories: categorizedMappings,
        confidence: {
          overall: overallConfidence,
          byCategory
        },
        metadata: {
          totalFound: state.extractedKeywords.length,
          mappedCount: state.databaseMappings.filter(m => !m.isNewItem).length,
          customCount: state.customEquipment.length,
          processingTimeMs: Date.now() - state.thoughts[0].timestamp.getTime(),
          sources,
          perplexityUsed: state.researchResults.length > 0
        }
      }
      
      logger.info(`✅ Extraction abgeschlossen: ${result.mappedEquipment.length} Items, ${overallConfidence}% Konfidenz`)
      
      return {
        result,
        thoughts: [{
          step: "finalize",
          thought: `Extraction abgeschlossen: ${result.mappedEquipment.length} Equipment-Items erkannt`,
          confidence: overallConfidence,
          timestamp: new Date(),
          data: result
        }]
      }
    })
    
    // Definiere Workflow-Edges
    workflow.addEdge(START, "analyze")
    workflow.addEdge("analyze", "extract_keywords")
    workflow.addEdge("extract_keywords", "categorize")
    workflow.addEdge("categorize", "research")
    workflow.addEdge("categorize", "map_to_database")
    workflow.addEdge("research", "map_to_database")
    workflow.addEdge("map_to_database", "create_custom")
    workflow.addEdge("map_to_database", "finalize")
    workflow.addEdge("create_custom", "finalize")
    workflow.addEdge("finalize", END)
    
    // Compile den Agenten
    this.agent = workflow.compile()
  }
  
  /**
   * Hauptmethode: Extrahiere Equipment
   */
  async extractEquipment(request: EquipmentExtractionRequest): Promise<EquipmentExtractionResult> {
    logger.info("🚀 Starte Equipment-Extraction", {
      pdfDocumentId: request.pdfDocumentId,
      vehicleInfo: request.context.vehicleInfo,
      enablePerplexity: request.options?.enablePerplexity
    })
    
    try {
      const result = await this.agent.invoke({
        request,
        extractedKeywords: [],
        identifiedFeatures: [],
        categorizedFeatures: new Map(),
        researchResults: [],
        databaseMappings: [],
        customEquipment: [],
        thoughts: [],
        currentStep: 'analyze',
        result: null,
        errors: []
      })
      
      if (result.result) {
        return result.result
      }
      
      // Fallback bei Fehler
      return this.createEmptyResult()
      
    } catch (error) {
      logger.error("Equipment-Extraction fehlgeschlagen:", error)
      return this.createEmptyResult()
    }
  }
  
  /**
   * Streaming-Methode für progressive Updates
   */
  async *extractEquipmentStream(request: EquipmentExtractionRequest): AsyncGenerator<any> {
    logger.info("🚀 Starte Equipment-Extraction mit Streaming")
    
    const startTime = Date.now()
    
    // Stream Start-Event
    yield {
      type: 'extraction_started',
      timestamp: Date.now(),
      data: {
        vehicleInfo: request.context.vehicleInfo
      }
    }
    
    try {
      // Führe Agent aus und streame Events
      const stream = await this.agent.stream({
        request,
        extractedKeywords: [],
        identifiedFeatures: [],
        categorizedFeatures: new Map(),
        researchResults: [],
        databaseMappings: [],
        customEquipment: [],
        thoughts: [],
        currentStep: 'analyze',
        result: null,
        errors: []
      })
      
      for await (const chunk of stream) {
        // Stream Node-Updates
        if (chunk.thoughts && chunk.thoughts.length > 0) {
          const thought = chunk.thoughts[chunk.thoughts.length - 1]
          yield {
            type: 'thought',
            timestamp: Date.now(),
            data: thought
          }
        }
        
        // Stream gefundene Equipment-Items
        if (chunk.databaseMappings && chunk.databaseMappings.length > 0) {
          for (const mapping of chunk.databaseMappings) {
            yield {
              type: 'equipment_found',
              timestamp: Date.now(),
              data: {
                item: mapping
              }
            }
            
            // Kleine Verzögerung für bessere UX
            await new Promise(resolve => setTimeout(resolve, 50))
          }
        }
        
        // Stream finale Ergebnisse
        if (chunk.result) {
          yield {
            type: 'extraction_complete',
            timestamp: Date.now(),
            data: chunk.result
          }
        }
      }
      
    } catch (error) {
      logger.error("Streaming-Extraction fehlgeschlagen:", error)
      yield {
        type: 'error',
        timestamp: Date.now(),
        data: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }
  
  /**
   * Kategorisiere ein Equipment-Feature
   */
  private async categorizeFeature(keyword: string): Promise<EquipmentCategory> {
    const lowerKeyword = keyword.toLowerCase()
    
    // Prüfe Keyword-Patterns
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => lowerKeyword.includes(k))) {
        return category as EquipmentCategory
      }
    }
    
    // KI-basierte Kategorisierung als Fallback
    try {
      const prompt = `
Kategorisiere folgendes Fahrzeug-Ausstattungsmerkmal in GENAU EINE dieser Kategorien:
- safety (Sicherheit)
- comfort (Komfort)
- assistance (Assistenzsysteme)
- infotainment (Entertainment)
- performance (Leistung)
- exterior (Außen)
- interior (Innen)
- lighting (Beleuchtung)
- other (Sonstiges)

Ausstattungsmerkmal: "${keyword}"

Antworte NUR mit dem Kategorie-Namen (z.B. "comfort").
`
      
      const response = await this.llm.invoke(prompt)
      const category = response.content.toString().trim().toLowerCase()
      
      if (category in CATEGORY_DESCRIPTIONS) {
        return category as EquipmentCategory
      }
    } catch (error) {
      logger.error(`Kategorisierung fehlgeschlagen für "${keyword}"`)
    }
    
    return 'other'
  }
  
  /**
   * Mappe Feature zu Datenbank-Equipment
   */
  private async mapFeatureToDatabase(feature: EquipmentFeature): Promise<EquipmentMapping | null> {
    try {
      // Suche Equipment in Datenbank
      const { data: equipment, error } = await this.supabase
        .from('equipment')
        .select('id, name, category')
        .or(`name.ilike.%${feature.keyword}%,name.ilike.%${feature.keyword.replace('-', ' ')}%`)
        .limit(1)
        .single()
      
      if (error || !equipment) {
        // Versuche Fuzzy-Match
        const fuzzyMatch = await this.fuzzyMatchEquipment(feature.keyword)
        if (fuzzyMatch) {
          return {
            equipmentId: fuzzyMatch.id,
            equipmentName: fuzzyMatch.name,
            category: fuzzyMatch.category as EquipmentCategory,
            confidence: feature.confidence * 0.8, // Reduziere Konfidenz bei Fuzzy-Match
            source: feature.source,
            isNewItem: false
          }
        }
        return null
      }
      
      return {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        category: equipment.category as EquipmentCategory,
        confidence: feature.confidence,
        source: feature.source,
        isNewItem: false
      }
      
    } catch (error) {
      logger.error(`Mapping fehlgeschlagen für "${feature.keyword}":`, error)
      return null
    }
  }
  
  /**
   * Fuzzy-Match für Equipment
   */
  private async fuzzyMatchEquipment(keyword: string): Promise<EquipmentItem | null> {
    // Nutze die PostgreSQL-Funktion aus der Migration
    const { data, error } = await this.supabase
      .rpc('match_equipment_by_keywords', {
        keywords: [keyword],
        organization_id: null // TODO: Organization-ID übergeben
      })
      .limit(1)
      .single()
    
    if (error || !data) return null
    
    return {
      id: data.equipment_id,
      name: data.equipment_name,
      category: data.category as EquipmentCategory,
      confidence_score: data.confidence
    }
  }
  
  /**
   * Pattern-basierte Keyword-Extraktion (Fallback)
   */
  private extractKeywordsByPattern(text: string): string[] {
    const keywords: string[] = []
    const lowerText = text.toLowerCase()
    
    // Vordefinierte Equipment-Patterns
    const patterns = [
      'navigationssystem', 'klimaautomatik', 'sitzheizung', 'lederausstattung',
      'led-scheinwerfer', 'xenon', 'alufelgen', 'einparkhilfe', 'parkassistent',
      'tempomat', 'adaptive cruise control', 'bluetooth', 'carplay', 'android auto',
      'panoramadach', 'schiebedach', 'allradantrieb', 'automatikgetriebe',
      'head-up display', 'spurhalteassistent', 'notbremsassistent'
    ]
    
    patterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        keywords.push(pattern.charAt(0).toUpperCase() + pattern.slice(1))
      }
    })
    
    return keywords
  }
  
  /**
   * Parse Perplexity-Research für Equipment
   */
  private parseResearchForEquipment(researchText: string): string[] {
    const equipment: string[] = []
    const lines = researchText.split('\n')
    
    lines.forEach(line => {
      // Suche nach Listen-Einträgen oder Equipment-Erwähnungen
      if (line.includes('-') || line.includes('•') || line.includes('*')) {
        const cleanLine = line.replace(/^[-•*]\s*/, '').trim()
        if (cleanLine.length > 2 && cleanLine.length < 50) {
          equipment.push(cleanLine)
        }
      }
    })
    
    return equipment
  }
  
  /**
   * Erstelle leeres Ergebnis (Fallback)
   */
  private createEmptyResult(): EquipmentExtractionResult {
    const emptyCategories = new Map<EquipmentCategory, EquipmentMapping[]>()
    const categories: EquipmentCategory[] = ['safety', 'comfort', 'assistance', 'infotainment', 'performance', 'exterior', 'interior', 'lighting', 'other']
    categories.forEach(cat => emptyCategories.set(cat, []))
    
    return {
      mappedEquipment: [],
      customEquipment: [],
      categories: emptyCategories,
      confidence: {
        overall: 0,
        byCategory: {
          safety: 0,
          comfort: 0,
          assistance: 0,
          infotainment: 0,
          performance: 0,
          exterior: 0,
          interior: 0,
          lighting: 0,
          other: 0
        }
      },
      metadata: {
        totalFound: 0,
        mappedCount: 0,
        customCount: 0,
        processingTimeMs: 0,
        sources: [],
        perplexityUsed: false
      }
    }
  }
}