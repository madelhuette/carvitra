/**
 * Equipment Extraction Agent Types
 * 
 * Spezialisierte Typen für die KI-gesteuerte Extraktion und Kategorisierung
 * von Fahrzeug-Ausstattungsmerkmalen
 */

// Equipment-Kategorien (normalisiert auf Englisch)
export type EquipmentCategory = 
  | 'safety'       // Sicherheit: ABS, ESP, Airbags
  | 'comfort'      // Komfort: Sitzheizung, Klimaautomatik
  | 'assistance'   // Assistenzsysteme: ACC, Spurhalteassistent
  | 'infotainment' // Infotainment: Navigation, CarPlay
  | 'performance'  // Performance: Sportfahrwerk, M-Paket
  | 'exterior'     // Exterieur: LED, Panoramadach
  | 'interior'     // Interieur: Leder, Ambiente-Beleuchtung
  | 'lighting'     // Beleuchtung: LED, Xenon, Laser
  | 'other'        // Sonstiges

// Equipment-Item aus der Datenbank
export interface EquipmentItem {
  id: string
  name: string
  category: EquipmentCategory
  icon?: string
  display_order?: number
  is_custom?: boolean
  confidence_score?: number
  source?: EquipmentSource
}

// Quelle der Equipment-Erkennung
export type EquipmentSource = 
  | 'pdf_explicit'        // Explizit im PDF genannt
  | 'ai_extraction'       // Von KI aus Text extrahiert
  | 'perplexity_research' // Durch Web-Recherche gefunden
  | 'pattern_matching'    // Durch Pattern erkannt
  | 'ai_inferred'        // Von KI geschlussfolgert
  | 'database_lookup'    // Aus ähnlichen Fahrzeugen
  | 'user_input'         // Manuell hinzugefügt

// Equipment-Feature während der Analyse
export interface EquipmentFeature {
  keyword: string           // Erkanntes Keyword (z.B. "Navigationssystem")
  originalText?: string     // Original-Text aus PDF
  category?: EquipmentCategory
  confidence: number        // 0-100
  source: EquipmentSource
  reasoning?: string        // KI-Begründung
  synonyms?: string[]       // Alternative Bezeichnungen
  dbMatches?: EquipmentItem[] // Gefundene DB-Einträge
}

// Equipment-Mapping zur Datenbank
export interface EquipmentMapping {
  equipmentId: string       // UUID aus equipment-Tabelle
  equipmentName: string
  category: EquipmentCategory
  confidence: number
  source: EquipmentSource
  isNewItem: boolean       // Muss neu erstellt werden?
}

// Request für Equipment-Extraction
export interface EquipmentExtractionRequest {
  pdfDocumentId: string
  offerId?: string
  context: {
    pdfText: string
    extractedData?: any      // AI-extracted data
    enrichedData?: any       // Perplexity-enriched data
    vehicleInfo?: {
      make: string
      model: string
      variant?: string
      year?: number
      vehicleType?: string
    }
  }
  options?: {
    enablePerplexity?: boolean     // Web-Recherche aktivieren
    confidenceThreshold?: number   // Min. Konfidenz (default: 70)
    maxResearchAttempts?: number   // Max. Recherche-Versuche
    includeCustomEquipment?: boolean // Custom Equipment erlauben
    language?: 'de' | 'en'        // Ausgabe-Sprache
  }
}

// Equipment-Extraction Ergebnis
export interface EquipmentExtractionResult {
  mappedEquipment: EquipmentMapping[]    // Gemappte DB-Items
  customEquipment: string[]               // Neue, nicht gemappte Items
  categories: Map<EquipmentCategory, EquipmentMapping[]> // Nach Kategorie gruppiert
  confidence: {
    overall: number                       // Gesamt-Konfidenz
    byCategory: Record<EquipmentCategory, number>
  }
  metadata: {
    totalFound: number
    mappedCount: number
    customCount: number
    processingTimeMs: number
    sources: EquipmentSource[]
    perplexityUsed: boolean
  }
}

// Streaming-Event für progressive Updates
export interface EquipmentStreamEvent {
  type: 'equipment_found' | 'category_complete' | 'research_started' | 'research_complete' | 'mapping_complete' | 'error'
  timestamp: number
  data?: {
    item?: EquipmentMapping
    category?: EquipmentCategory
    progress?: {
      current: number
      total: number
    }
    error?: string
  }
}

// Agent-Gedanken während der Verarbeitung
export interface EquipmentAgentThought {
  step: string
  thought: string
  confidence: number
  timestamp: Date
  data?: any
}

// Research-Ergebnis von Perplexity
export interface EquipmentResearchResult {
  query: string
  result: string
  equipmentFound: string[]
  confidence: number
  source: 'perplexity'
  timestamp: Date
}

// Konfidenz-Schwellwerte
export const CONFIDENCE_THRESHOLDS = {
  AUTO_APPLY: 80,        // Automatisch anwenden
  SUGGEST: 60,          // Vorschlagen mit Review
  RESEARCH_NEEDED: 40,  // Recherche erforderlich
  IGNORE: 20           // Zu unsicher, ignorieren
} as const

// Equipment-Kategorisierungs-Map (Deutsch -> Englisch)
export const CATEGORY_TRANSLATIONS: Record<string, EquipmentCategory> = {
  // Deutsch
  'sicherheit': 'safety',
  'komfort': 'comfort',
  'assistenzsysteme': 'assistance',
  'assistenz': 'assistance',
  'infotainment': 'infotainment',
  'multimedia': 'infotainment',
  'entertainment': 'infotainment',
  'performance': 'performance',
  'sport': 'performance',
  'leistung': 'performance',
  'exterieur': 'exterior',
  'außen': 'exterior',
  'interieur': 'interior',
  'innen': 'interior',
  'innenraum': 'interior',
  'beleuchtung': 'lighting',
  'licht': 'lighting',
  'sonstiges': 'other',
  // Englisch (pass-through)
  'safety': 'safety',
  'comfort': 'comfort',
  'assistance': 'assistance',
  'exterior': 'exterior',
  'interior': 'interior',
  'lighting': 'lighting',
  'other': 'other'
} as const

// Kategorie-Beschreibungen für KI-Context
export const CATEGORY_DESCRIPTIONS: Record<EquipmentCategory, string> = {
  safety: 'Sicherheitsrelevante Ausstattung wie ABS, ESP, Airbags, Notbremsassistent',
  comfort: 'Komfort-Features wie Sitzheizung, Klimaautomatik, Massagesitze, elektrische Sitze',
  assistance: 'Fahrerassistenzsysteme wie ACC, Spurhalteassistent, Parkpilot, Totwinkelwarner',
  infotainment: 'Entertainment und Konnektivität wie Navigation, Apple CarPlay, Sound System',
  performance: 'Performance-Ausstattung wie Sportfahrwerk, M-Paket, Performance-Bremsen',
  exterior: 'Äußere Ausstattung wie Alufelgen, Panoramadach, Anhängerkupplung',
  interior: 'Innenraum-Ausstattung wie Leder, Ambiente-Beleuchtung, Head-Up Display',
  lighting: 'Beleuchtung wie LED-Scheinwerfer, Xenon, Laser-Licht, adaptives Licht',
  other: 'Sonstige Ausstattung die nicht in andere Kategorien passt'
} as const

// Typische Equipment-Keywords pro Kategorie (für Pattern-Matching)
export const CATEGORY_KEYWORDS: Record<EquipmentCategory, string[]> = {
  safety: ['abs', 'esp', 'airbag', 'notbrems', 'kollision', 'gurt', 'isofix'],
  comfort: ['heizung', 'klima', 'massage', 'elektrisch', 'memory', 'komfort'],
  assistance: ['assistent', 'acc', 'spurhalte', 'park', 'pilot', 'radar', 'kamera'],
  infotainment: ['navi', 'carplay', 'android', 'bluetooth', 'sound', 'display', 'touchscreen'],
  performance: ['sport', 'performance', 'm-paket', 'amg', 'rs', 'tuning', 'fahrwerk'],
  exterior: ['felgen', 'alu', 'panorama', 'dach', 'anhänger', 'spoiler', 'chrom'],
  interior: ['leder', 'alcantara', 'ambiente', 'head-up', 'holz', 'carbon'],
  lighting: ['led', 'xenon', 'laser', 'matrix', 'adaptiv', 'scheinwerfer', 'tagfahr'],
  other: []
} as const

// Validation Schema für Equipment-Namen
export const EQUIPMENT_NAME_RULES = {
  minLength: 2,
  maxLength: 100,
  pattern: /^[a-zA-ZäöüÄÖÜß0-9\s\-\/\+\&\(\)]+$/,
  forbiddenWords: ['test', 'todo', 'xxx', 'placeholder']
} as const