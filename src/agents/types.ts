/**
 * LangGraph Field Resolution Agent Types
 * 
 * Defines the state and interfaces for the autonomous field resolution agent
 * that can "think", research, and resolve form fields intelligently.
 */

// Field Request Types
export interface FieldRequest {
  fieldName: string
  fieldType: 'enum' | 'number' | 'string' | 'boolean'
  constraints?: {
    enumOptions?: string[]      // Bei enum: erlaubte Werte
    min?: number               // Bei number
    max?: number               
    pattern?: RegExp           // Bei string
    format?: string            // z.B. "email", "url"
    required?: boolean
  }
}

// Context Data Types
export interface FieldContext {
  pdfText?: string
  extractedData?: any
  enrichedData?: any
  currentFormData?: any        // Bereits ausgefüllte Felder
  instructions?: string        // Spezielle Anweisungen
}

// Research Result Types
export interface ResearchResult {
  source: 'perplexity' | 'database' | 'pattern_matching'
  query: string
  result: any
  confidence: number
  timestamp: Date
}

// Agent Thought Process
export interface AgentThought {
  step: string
  reasoning: string
  timestamp: Date
  confidence?: number
}

// Final Resolution
export interface FieldResolution {
  value: any
  confidence: number
  reasoning: string
  sources: string[]
  needsReview?: boolean
}

// Agent Decision Points
export type AgentNextStep = 
  | 'extractFromContext' 
  | 'performResearch' 
  | 'synthesize' 
  | 'validate' 
  | 'retry'
  | '__end__'

// Complete Agent State (for LangGraph)
export interface FieldAgentState {
  // Input
  fieldRequest: FieldRequest
  context: FieldContext
  
  // Agent's "Gedankenprozess"
  thoughts: AgentThought[]
  
  // Forschungsergebnisse
  researchResults: ResearchResult[]
  
  // Zwischenergebnisse
  extractionAttempts: Array<{
    source: string
    result: any
    confidence: number
  }>
  
  // Navigation
  nextStep: AgentNextStep
  retryCount: number
  
  // Output
  resolution?: FieldResolution
  
  // Error Handling
  errors: string[]
}

// Service Interface für externe APIs
export interface ExternalResearchService {
  search(query: string, context?: any): Promise<ResearchResult>
}

// Configuration
export interface AgentConfig {
  maxRetries: number
  minConfidenceThreshold: number
  enablePerplexityResearch: boolean
  anthropicApiKey: string
  perplexityApiKey?: string
  debug: boolean
}

// Agent Response (was zurückgegeben wird)
export interface AgentResponse {
  success: boolean
  resolution?: FieldResolution
  thoughts: AgentThought[]
  researchPerformed: boolean
  processingTimeMs: number
  error?: string
}