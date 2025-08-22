/**
 * API Route für LangGraph Field Resolution Agent
 * 
 * Stellt den Field Resolution Agent als Server-API zur Verfügung,
 * da LangGraph Node.js spezifische Module benötigt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFieldResolutionAgent } from '@/agents/field-resolution-agent';
import { FieldRequest, FieldContext } from '@/agents/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('FieldResolutionAPI');

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { fieldRequest, context }: { fieldRequest: FieldRequest, context: FieldContext } = body;
    
    logger.info('🤖 Field Resolution Agent API called', { 
      fieldName: fieldRequest.fieldName,
      fieldType: fieldRequest.fieldType,
      hasExtractedData: !!context.extractedData,
      hasEnrichedData: !!context.enrichedData
    });
    
    // Validierung
    if (!fieldRequest?.fieldName) {
      return NextResponse.json(
        { error: 'Missing required field: fieldRequest.fieldName' },
        { status: 400 }
      );
    }
    
    // Agent erstellen
    const agent = createFieldResolutionAgent({
      debug: true, // Aktiviere Debug-Logs für Tests
      maxRetries: 2,
      minConfidenceThreshold: 20, // REDUZIERT: Akzeptiere plausible Werte bei niedriger Konfidenz
      enablePerplexityResearch: true, // AKTIVIERT - Vollständige Perplexity Integration
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      perplexityApiKey: process.env.PERPLEXITY_API_KEY,
    });
    
    logger.info('🧠 LangGraph Agent initialized, starting resolution...', {
      fieldName: fieldRequest.fieldName
    });
    
    // Agent ausführen
    const result = await agent.resolveField(fieldRequest, context);
    
    const processingTime = Date.now() - startTime;
    
    logger.info('🎯 LangGraph Agent completed', {
      success: result.success,
      confidence: result.resolution?.confidence,
      processingTime,
      thoughtsCount: result.thoughts?.length || 0,
      researchPerformed: result.researchPerformed
    });
    
    // Debug: Gedankenprozess ausgeben
    if (result.thoughts) {
      console.log('💭 Agent Thoughts:');
      result.thoughts.forEach((thought, i) => {
        console.log(`  ${i+1}. ${thought.step}: ${thought.reasoning}`);
      });
    }
    
    return NextResponse.json({
      success: result.success,
      resolution: result.resolution,
      thoughts: result.thoughts,
      researchPerformed: result.researchPerformed,
      processingTimeMs: processingTime,
      error: result.error,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        agent: 'field-resolution-langgraph'
      }
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('❌ Field Resolution Agent API error', error, {
      processingTime,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        agent: 'field-resolution-langgraph'
      }
    }, { status: 500 });
  }
}

// Health Check Endpoint
export async function GET(request: NextRequest) {
  try {
    // Prüfe ob alle Dependencies verfügbar sind
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
    
    return NextResponse.json({
      status: 'healthy',
      service: 'field-resolution-agent',
      version: '1.0',
      dependencies: {
        anthropic: hasAnthropicKey ? 'available' : 'missing',
        perplexity: hasPerplexityKey ? 'available' : 'missing',
        langgraph: 'available' // Wenn diese Route läuft, ist LangGraph verfügbar
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}