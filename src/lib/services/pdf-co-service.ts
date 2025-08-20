/**
 * PDF.co API Service für professionelle PDF-Text-Extraktion mit OCR
 */

interface PDFCoResponse {
  body?: string
  pageCount?: number
  error: boolean
  status?: number
  message?: string
  remainingCredits?: number
  url?: string
}

export class PDFCoService {
  private static readonly API_URL = 'https://api.pdf.co/v1/pdf/convert/to/text'
  private static readonly API_KEY = process.env.PDF_CO_KEY

  /**
   * Extrahiert Text aus einer PDF-URL mit OCR-Unterstützung
   */
  static async extractTextFromPDF(
    pdfUrl: string,
    options: {
      lang?: string
      pages?: string
      timeout?: number
      maxRetries?: number
    } = {}
  ): Promise<{ text: string; pageCount: number; error?: string }> {
    const { 
      lang = 'deu', // Deutsch als Standard
      pages = '0-', // Alle Seiten
      timeout = 60000, // 60 Sekunden Timeout
      maxRetries = 2 
    } = options

    if (!this.API_KEY) {
      throw new Error('PDF_CO_KEY environment variable is not set')
    }

    console.log('[PDF.co] Starting text extraction from URL:', pdfUrl.substring(0, 50) + '...')

    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[PDF.co] Attempt ${attempt}/${maxRetries}...`)
        
        // AbortController für Timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.API_KEY
          },
          body: JSON.stringify({
            url: pdfUrl,
            inline: true, // Text direkt in der Response zurückgeben
            async: false, // Synchrone Verarbeitung
            lang: lang,
            pages: pages,
            // Zusätzliche Optionen für bessere Extraktion
            unwrap: true, // Text-Wrapping entfernen
            // rect Parameter entfernt, da er Probleme verursacht
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[PDF.co] HTTP error ${response.status}:`, errorText)
          throw new Error(`PDF.co API error: ${response.status} - ${errorText}`)
        }

        const result: PDFCoResponse = await response.json()
        console.log('[PDF.co] Response received:', {
          error: result.error,
          pageCount: result.pageCount,
          textLength: result.body?.length || 0,
          remainingCredits: result.remainingCredits
        })

        if (result.error) {
          throw new Error(result.message || 'PDF.co processing error')
        }

        if (!result.body) {
          console.warn('[PDF.co] No text extracted from PDF')
          return {
            text: '',
            pageCount: result.pageCount || 0,
            error: 'No text could be extracted from the PDF'
          }
        }

        // Erfolgreiche Extraktion
        return {
          text: result.body,
          pageCount: result.pageCount || 0
        }

      } catch (error: any) {
        lastError = error
        console.error(`[PDF.co] Attempt ${attempt} failed:`, error.message)

        // Bei Timeout oder Netzwerkfehler: Retry mit Backoff
        if (error.name === 'AbortError' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          if (attempt < maxRetries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Max 10s wait
            console.log(`[PDF.co] Waiting ${waitTime}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }

        // Bei anderen Fehlern direkt abbrechen
        break
      }
    }

    // Alle Versuche fehlgeschlagen
    console.error('[PDF.co] All attempts failed')
    return {
      text: '',
      pageCount: 0,
      error: lastError?.message || 'Failed to extract text from PDF'
    }
  }

  /**
   * Prüft die verbleibenden Credits
   */
  static async checkCredits(): Promise<number | null> {
    if (!this.API_KEY) {
      console.warn('[PDF.co] No API key configured')
      return null
    }

    try {
      const response = await fetch('https://api.pdf.co/v1/account/balance', {
        headers: {
          'x-api-key': this.API_KEY
        }
      })

      if (!response.ok) {
        console.error('[PDF.co] Failed to check credits')
        return null
      }

      const data = await response.json()
      return data.remainingCredits || 0
    } catch (error) {
      console.error('[PDF.co] Error checking credits:', error)
      return null
    }
  }
}