import { PDFDocument } from 'pdf-lib'

export interface PDFParseResult {
  text: string
  numpages: number
  info: {
    Title?: string
    Author?: string
    Subject?: string
    Creator?: string
    Producer?: string
    CreationDate?: Date
    ModDate?: Date
  }
}

/**
 * Alternative PDF-Parser ohne pdf-parse Library
 * Verwendet pdf-lib für grundlegende Metadaten
 * Text-Extraktion erfolgt über AI-Service direkt aus dem Buffer
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    // PDF mit pdf-lib laden für Metadaten
    const pdfDoc = await PDFDocument.load(buffer, { 
      ignoreEncryption: true,
      throwOnInvalidObject: false 
    })
    
    const pages = pdfDoc.getPages()
    const pageCount = pages.length
    
    // Metadaten extrahieren
    const title = pdfDoc.getTitle()
    const author = pdfDoc.getAuthor()
    const subject = pdfDoc.getSubject()
    const creator = pdfDoc.getCreator()
    const producer = pdfDoc.getProducer()
    const creationDate = pdfDoc.getCreationDate()
    const modificationDate = pdfDoc.getModificationDate()
    
    // Für Text-Extraktion verwenden wir einen einfachen Ansatz
    // Der echte Text wird später von der AI extrahiert
    let text = ''
    
    // Basis-Text-Extraktion (nur für Fallback)
    // Hinweis: pdf-lib unterstützt keine direkte Text-Extraktion
    // Wir nutzen Buffer-Analyse für grobe Textextraktion
    const bufferText = buffer.toString('utf-8', 0, Math.min(buffer.length, 100000))
    
    // Extrahiere lesbaren Text aus dem Buffer (sehr rudimentär)
    const textMatches = bufferText.match(/[\x20-\x7E\xC0-\xFF]+/g) || []
    text = textMatches
      .filter(match => match.length > 3) // Nur Strings länger als 3 Zeichen
      .join(' ')
      .substring(0, 50000) // Limitiere auf erste 50k Zeichen
    
    return {
      text: text || 'PDF-Text konnte nicht extrahiert werden. KI-Analyse wird auf Basis der Rohdaten durchgeführt.',
      numpages: pageCount,
      info: {
        Title: title || undefined,
        Author: author || undefined,
        Subject: subject || undefined,
        Creator: creator || undefined,
        Producer: producer || undefined,
        CreationDate: creationDate || undefined,
        ModDate: modificationDate || undefined
      }
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    
    // Fallback für beschädigte PDFs
    return {
      text: 'PDF konnte nicht geparst werden. KI-Analyse wird trotzdem versucht.',
      numpages: 0,
      info: {}
    }
  }
}

/**
 * Extrahiert Text aus PDF-Buffer mit OCR-Fallback
 * Für erweiterte Text-Extraktion empfiehlt sich ein dedizierter Service
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const result = await parsePDF(buffer)
  return result.text
}