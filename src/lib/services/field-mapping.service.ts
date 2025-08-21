import { createClient } from '@/lib/supabase/server'

interface MappingResult {
  id: string | null
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'fallback' | 'not_found'
}

export class FieldMappingService {
  private supabase: any
  private cache: Map<string, any[]> = new Map()
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null

  constructor() {
    // Don't initialize in constructor, do it lazily
  }

  private async ensureInitialized() {
    if (this.initialized) return
    
    if (!this.initPromise) {
      this.initPromise = this.initSupabase()
    }
    
    await this.initPromise
  }

  private async initSupabase() {
    this.supabase = await createClient()
    this.initialized = true
  }

  /**
   * Maps a text value to a database ID for select fields
   */
  async mapToId(tableName: string, value: string, nameColumn: string = 'name'): Promise<MappingResult> {
    await this.ensureInitialized()
    
    if (!value) {
      return { id: null, confidence: 0, matchType: 'not_found' }
    }

    // Get or fetch table data
    const data = await this.getTableData(tableName, nameColumn)
    
    // Try exact match first (case-insensitive)
    const exactMatch = data.find(item => 
      item[nameColumn].toLowerCase() === value.toLowerCase()
    )
    
    if (exactMatch) {
      return { 
        id: exactMatch.id, 
        confidence: 100, 
        matchType: 'exact' 
      }
    }

    // Try fuzzy matching
    const fuzzyMatch = this.findFuzzyMatch(data, value, nameColumn)
    
    if (fuzzyMatch) {
      return fuzzyMatch
    }

    // Try common variations
    const variationMatch = await this.tryCommonVariations(tableName, value, nameColumn, data)
    
    if (variationMatch) {
      return variationMatch
    }

    return { id: null, confidence: 0, matchType: 'not_found' }
  }

  /**
   * Maps multiple fields at once
   */
  async mapFields(mappings: Array<{ table: string; value: string; column?: string }>): Promise<Record<string, MappingResult>> {
    await this.ensureInitialized()
    
    const results: Record<string, MappingResult> = {}
    
    await Promise.all(
      mappings.map(async ({ table, value, column }) => {
        results[table] = await this.mapToId(table, value, column)
      })
    )
    
    return results
  }

  /**
   * Get or fetch table data with caching
   */
  private async getTableData(tableName: string, nameColumn: string): Promise<any[]> {
    await this.ensureInitialized()
    
    const cacheKey = `${tableName}_${nameColumn}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const { data, error } = await this.supabase
      .from(tableName)
      .select(`id, ${nameColumn}`)
      .order(nameColumn)

    if (error || !data) {
      console.error(`Error fetching ${tableName}:`, error)
      return []
    }

    this.cache.set(cacheKey, data)
    return data
  }

  /**
   * Find fuzzy match using Levenshtein distance
   */
  private findFuzzyMatch(data: any[], value: string, nameColumn: string): MappingResult | null {
    let bestMatch = null
    let bestDistance = Infinity
    
    for (const item of data) {
      const distance = this.levenshteinDistance(
        value.toLowerCase(), 
        item[nameColumn].toLowerCase()
      )
      
      // Calculate similarity percentage
      const maxLength = Math.max(value.length, item[nameColumn].length)
      const similarity = ((maxLength - distance) / maxLength) * 100
      
      if (similarity > 80 && distance < bestDistance) {
        bestDistance = distance
        bestMatch = {
          id: item.id,
          confidence: Math.round(similarity),
          matchType: 'fuzzy' as const
        }
      }
    }
    
    return bestMatch
  }

  /**
   * Try common variations for specific tables
   */
  private async tryCommonVariations(
    tableName: string, 
    value: string, 
    nameColumn: string,
    data: any[]
  ): Promise<MappingResult | null> {
    const valueLower = value.toLowerCase()
    
    // Special handling for makes (car brands)
    if (tableName === 'makes') {
      const brandVariations: Record<string, string[]> = {
        'mercedes': ['mercedes-benz', 'mercedes benz', 'mb'],
        'volkswagen': ['vw', 'volkswagen'],
        'bmw': ['bayerische motoren werke'],
        'vw': ['volkswagen'],
        'mb': ['mercedes-benz', 'mercedes'],
      }
      
      for (const [key, variations] of Object.entries(brandVariations)) {
        if (valueLower.includes(key) || variations.some(v => valueLower.includes(v))) {
          const match = data.find(item => 
            variations.some(v => item[nameColumn].toLowerCase().includes(v)) ||
            item[nameColumn].toLowerCase().includes(key)
          )
          
          if (match) {
            return {
              id: match.id,
              confidence: 85,
              matchType: 'fuzzy'
            }
          }
        }
      }
    }
    
    // Special handling for fuel types
    if (tableName === 'fuel_types') {
      const fuelVariations: Record<string, string[]> = {
        'benzin': ['benzin', 'petrol', 'gasoline', 'super'],
        'diesel': ['diesel', 'dieselmotor'],
        'elektro': ['elektro', 'electric', 'ev', 'bev'],
        'hybrid': ['hybrid', 'plug-in hybrid', 'phev'],
        'gas': ['gas', 'lpg', 'cng', 'erdgas'],
      }
      
      for (const [key, variations] of Object.entries(fuelVariations)) {
        if (variations.some(v => valueLower.includes(v))) {
          const match = data.find(item => 
            item[nameColumn].toLowerCase().includes(key)
          )
          
          if (match) {
            return {
              id: match.id,
              confidence: 90,
              matchType: 'fuzzy'
            }
          }
        }
      }
    }
    
    // Special handling for transmission types
    if (tableName === 'transmission_types') {
      const transmissionVariations: Record<string, string[]> = {
        'automatik': ['automatik', 'automatic', 'auto', 'automatikgetriebe', 'dsg', 'dct'],
        'manuell': ['manuell', 'manual', 'schaltgetriebe', 'handschaltung', '6-gang'],
        'sequentiell': ['sequentiell', 'sequential', 'smg'],
      }
      
      for (const [key, variations] of Object.entries(transmissionVariations)) {
        if (variations.some(v => valueLower.includes(v))) {
          const match = data.find(item => 
            item[nameColumn].toLowerCase().includes(key)
          )
          
          if (match) {
            return {
              id: match.id,
              confidence: 88,
              matchType: 'fuzzy'
            }
          }
        }
      }
    }
    
    return null
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }
}

// Singleton instance
let instance: FieldMappingService | null = null

export function getFieldMappingService(): FieldMappingService {
  if (!instance) {
    instance = new FieldMappingService()
  }
  return instance
}