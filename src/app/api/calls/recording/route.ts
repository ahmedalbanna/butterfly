import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Upload call recording
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callId = formData.get('callId') as string;
    const audioBlob = formData.get('audio') as Blob;

    if (!callId || !audioBlob) {
      return new Response(
        JSON.stringify({ error: 'Missing callId or audio file' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
    try {
      await mkdir(recordingsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `call-${callId.slice(0, 8)}-${timestamp}.webm`;
    const filepath = path.join(recordingsDir, filename);

    // Convert blob to buffer and save
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    const recordingUrl = `/recordings/${filename}`;
    const recordingSize = buffer.length;

    // Update call session with recording info
    await prisma.voiceCallSession.update({
      where: { id: callId },
      data: {
        recordingUrl,
        recordingSize,
      },
    });

    console.log(`[Recording] Saved call ${callId.slice(0, 8)} recording: ${filename} (${recordingSize} bytes)`);

    return new Response(
      JSON.stringify({
        success: true,
        recordingUrl,
        recordingSize,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Recording] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save recording' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get recording info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return new Response(
        JSON.stringify({ error: 'Missing callId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const call = await prisma.voiceCallSession.findUnique({
      where: { id: callId },
      select: {
        recordingUrl: true,
        recordingSize: true,
      },
    });

    if (!call) {
      return new Response(
        JSON.stringify({ error: 'Call not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        recordingUrl: call.recordingUrl,
        recordingSize: call.recordingSize,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Recording] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get recording info' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
