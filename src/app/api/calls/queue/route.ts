import { NextRequest } from 'next/server';
import {
  addToCallQueue,
  getNextCallFromQueue,
  removeFromCallQueue,
  getQueueLength,
  getQueueCalls,
} from '@/lib/redis';

/**
 * Get queue information or next call
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'next' | 'all' | 'length'

    if (action === 'next') {
      // Get next call from queue (but don't remove it)
      const nextCall = await getNextCallFromQueue();
      
      return new Response(
        JSON.stringify({
          success: true,
          call: nextCall,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'all') {
      // Get all calls in queue
      const limit = parseInt(searchParams.get('limit') || '10');
      const calls = await getQueueCalls(limit);
      
      return new Response(
        JSON.stringify({
          success: true,
          calls,
          length: calls.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default: Get queue length
    const length = await getQueueLength();
    
    return new Response(
      JSON.stringify({
        success: true,
        length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Call Queue] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Add call to queue (called internally when call is created)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId, customerId, customerName, priority } = body;

    if (!callId || !customerId || !customerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await addToCallQueue(callId, {
      customerId,
      customerName,
      timestamp: Date.now(),
      priority: priority || 0,
    });

    const queueLength = await getQueueLength();

    console.log(`[Call Queue] Call ${callId.slice(0, 8)} added. Queue length: ${queueLength}`);

    return new Response(
      JSON.stringify({
        success: true,
        queuePosition: queueLength,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Call Queue] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Remove call from queue (when answered, declined, or cancelled)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return new Response(
        JSON.stringify({ error: 'Missing callId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await removeFromCallQueue(callId);

    const queueLength = await getQueueLength();

    console.log(`[Call Queue] Call ${callId.slice(0, 8)} removed. Queue length: ${queueLength}`);

    return new Response(
      JSON.stringify({
        success: true,
        queueLength,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Call Queue] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
