import { NextRequest, NextResponse } from 'next/server'
import { EquipmentExtractionAgent } from '@/agents/equipment-extraction-agent'
import { createLogger } from '@/lib/logger'
import type { EquipmentExtractionRequest, EquipmentStreamEvent } from '@/agents/equipment-types'

const logger = createLogger('EquipmentExtractionAPI')

/**
 * POST /api/agents/equipment-extraction
 * 
 * Extrahiert Equipment-Features aus PDF mit KI-Agent
 * Unterstützt Streaming für progressive Updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EquipmentExtractionRequest
    
    logger.info('🚀 Equipment extraction requested', {
      pdfDocumentId: body.pdfDocumentId,
      hasVehicleInfo: !!body.context?.vehicleInfo,
      enablePerplexity: body.options?.enablePerplexity,
      streaming: request.headers.get('accept') === 'text/event-stream'
    })
    
    // Validierung
    if (!body.pdfDocumentId) {
      return NextResponse.json(
        { error: 'pdfDocumentId is required' },
        { status: 400 }
      )
    }
    
    if (!body.context?.pdfText) {
      return NextResponse.json(
        { error: 'context.pdfText is required' },
        { status: 400 }
      )
    }
    
    // Erstelle Agent-Instanz
    const agent = new EquipmentExtractionAgent()
    
    // Check ob Streaming gewünscht ist
    const acceptHeader = request.headers.get('accept')
    const wantsStreaming = acceptHeader === 'text/event-stream'
    
    if (wantsStreaming) {
      // Streaming-Response mit Server-Sent Events
      logger.info('📡 Starting streaming equipment extraction')
      
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Nutze den Streaming-Generator des Agents
            const generator = agent.extractEquipmentStream(body)
            
            for await (const event of generator) {
              // Formatiere als SSE
              const sseEvent = `data: ${JSON.stringify(event)}\n\n`
              controller.enqueue(encoder.encode(sseEvent))
              
              // Log wichtige Events
              if (event.type === 'equipment_found') {
                logger.debug(`✅ Equipment found: ${event.data.item.equipmentName}`)
              } else if (event.type === 'thought') {
                logger.debug(`💭 Agent thinking: ${event.data.thought}`)
              }
            }
            
            // Stream abschließen
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            
          } catch (error) {
            logger.error('Streaming error:', error)
            
            // Sende Error-Event
            const errorEvent: EquipmentStreamEvent = {
              type: 'error',
              timestamp: Date.now(),
              data: {
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
            controller.close()
          }
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no' // Disable Nginx buffering
        }
      })
      
    } else {
      // Standard JSON-Response (nicht-streaming)
      logger.info('📦 Starting non-streaming equipment extraction')
      
      try {
        const startTime = Date.now()
        
        // Führe Extraction aus
        const result = await agent.extractEquipment(body)
        
        const processingTime = Date.now() - startTime
        
        logger.info('✅ Equipment extraction completed', {
          totalFound: result.metadata.totalFound,
          mappedCount: result.metadata.mappedCount,
          customCount: result.metadata.customCount,
          overallConfidence: result.confidence.overall,
          processingTimeMs: processingTime
        })
        
        // Log Kategorien mit Counts
        result.categories.forEach((items, category) => {
          if (items.length > 0) {
            logger.debug(`📁 ${category}: ${items.length} items`)
          }
        })
        
        return NextResponse.json({
          success: true,
          result,
          processingTimeMs: processingTime
        })
        
      } catch (error) {
        logger.error('Equipment extraction failed:', error)
        
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Equipment extraction failed',
            details: error instanceof Error ? error.stack : undefined
          },
          { status: 500 }
        )
      }
    }
    
  } catch (error) {
    logger.error('API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 400 }
    )
  }
}

/**
 * OPTIONS /api/agents/equipment-extraction
 * 
 * CORS Preflight für Streaming
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    }
  })
}