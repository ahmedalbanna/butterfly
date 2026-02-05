import { useEffect, useRef, useState, useCallback } from 'react';

export type CallStatus = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error';

interface WebRTCCallOptions {
  callId: string;
  role: 'customer' | 'admin';
  onStatusChange?: (status: CallStatus) => void;
  onError?: (error: string) => void;
}

// STUN and TURN server configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:free.expressturn.com:3478',
      username: '000000002085337863',
      credential: 'CN6njZn6WEp2fA1KwnjjM5BTLiE=',
    },
  ],
};

export function useWebRTCCall({ callId, role, onStatusChange, onError }: WebRTCCallOptions) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [localAudioLevel, setLocalVolume] = useState(0);
  const [remoteAudioLevel, setRemoteVolume] = useState(0);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingPollingRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSignalingTimestampRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Audio Analysis Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyzerRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update status and notify
  const updateStatus = useCallback((newStatus: CallStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // Handle errors
  const handleError = useCallback((error: string) => {
    console.error('[WebRTC] Error:', error);
    updateStatus('error');
    onError?.(error);
  }, [updateStatus, onError]);

  // Audio Level Detection
  const setupAudioAnalysis = useCallback((stream: MediaStream, type: 'local' | 'remote') => {
    if (!stream) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      if (type === 'local') {
        localAnalyzerRef.current = analyzer;
      } else {
        remoteAnalyzerRef.current = analyzer;
      }

      // Cancel previous animation frame if exists
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const checkVolume = () => {
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(dataArray);
        
        let values = 0;
        for (let i = 0; i < dataArray.length; i++) {
          values += dataArray[i];
        }
        const average = values / dataArray.length;
        const level = Math.min(100, Math.round((average / 128) * 100));
        
        if (type === 'local') setLocalVolume(level);
        else setRemoteVolume(level);
        
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };
      
      checkVolume();
    } catch (err) {
      console.warn('[WebRTC] Audio analysis failed:', err);
    }
  }, []);

  // Send signaling message
  const sendSignalingMessage = useCallback(async (type: string, data: any) => {
    try {
      await fetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          type,
          sender: role,
          data,
        }),
      });
    } catch (error) {
      console.error('[WebRTC] Failed to send signaling message:', error);
    }
  }, [callId, role]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: any) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      switch (message.type) {
        case 'offer':
          console.log('[WebRTC] Received offer');
          await pc.setRemoteDescription(new RTCSessionDescription(message.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignalingMessage('answer', answer);
          updateStatus('connected');
          break;

        case 'answer':
          console.log('[WebRTC] Received answer');
          await pc.setRemoteDescription(new RTCSessionDescription(message.data));
          updateStatus('connected');
          break;

        case 'ice-candidate':
          if (message.data) {
            await pc.addIceCandidate(new RTCIceCandidate(message.data));
          }
          break;

        case 'call-ended':
          console.log('[WebRTC] Call ended by remote peer');
          endCall();
          break;
      }
    } catch (error) {
      console.error('[WebRTC] Error handling signaling message:', error);
      handleError('Failed to process signaling message');
    }
  }, [sendSignalingMessage, updateStatus, handleError]);

  // Fallback polling mechanism (used if SSE fails)
  const startPollingFallback = useCallback(() => {
    if (signalingPollingRef.current) return; // Already polling

    const pollSignalingMessages = async () => {
      try {
        const url = new URL('/api/calls/signal', window.location.origin);
        url.searchParams.set('callId', callId);
        url.searchParams.set('recipient', role);
        url.searchParams.set('since', lastSignalingTimestampRef.current.toString());

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.success && data.messages) {
          for (const message of data.messages) {
            await handleSignalingMessage(message);
          }
          lastSignalingTimestampRef.current = data.timestamp;
        }
      } catch (error) {
        console.error('[WebRTC] Failed to poll signaling messages:', error);
      }
    };

    signalingPollingRef.current = setInterval(pollSignalingMessages, 1000);
  }, [callId, role, handleSignalingMessage]);

  // Subscribe to real-time signaling via Server-Sent Events
  const subscribeToSignaling = useCallback(() => {
    try {
      const url = new URL('/api/calls/signal/subscribe', window.location.origin);
      url.searchParams.set('callId', callId);
      url.searchParams.set('recipient', role);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[WebRTC] SSE connection opened');
      };

      eventSource.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Skip connection confirmation messages
          if (message.type === 'connected') {
            console.log('[WebRTC] SSE connected');
            return;
          }

          // Handle signaling message
          await handleSignalingMessage(message);
        } catch (error) {
          console.error('[WebRTC] Error processing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[WebRTC] SSE error:', error);
        eventSource.close();
        eventSourceRef.current = null;

        // Fallback to polling if SSE fails
        console.log('[WebRTC] Falling back to polling');
        startPollingFallback();
      };

      return eventSource;
    } catch (error) {
      console.error('[WebRTC] Failed to establish SSE connection:', error);
      // Fallback to polling
      startPollingFallback();
    }
  }, [callId, role, handleSignalingMessage, startPollingFallback]);

  // Start recording
  const startRecording = useCallback((stream: MediaStream) => {
    try {
      // Create media recorder for the mixed stream (local + remote)
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Create blob from recorded chunks
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        recordedChunksRef.current = [];

        // Upload recording
        const formData = new FormData();
        formData.append('callId', callId);
        formData.append('audio', blob);

        try {
          await fetch('/api/calls/recording', {
            method: 'POST',
            body: formData,
          });
          console.log('[WebRTC] Recording uploaded successfully');
        } catch (error) {
          console.error('[WebRTC] Failed to upload recording:', error);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('[WebRTC] Recording started');
    } catch (error) {
      console.error('[WebRTC] Failed to start recording:', error);
    }
  }, [callId]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      console.log('[WebRTC] Recording stopped');
    }
  }, [isRecording]);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage('ice-candidate', event.candidate);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream');
      const remoteMediaStream = event.streams[0];
      setRemoteStream(remoteMediaStream);
      setupAudioAnalysis(remoteMediaStream, 'remote');
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        updateStatus('connected');
        
        // Start recording when connected (mix local and remote streams)
        if (localStream && remoteStream) {
          const audioContext = new AudioContext();
          const destination = audioContext.createMediaStreamDestination();
          
          // Add local stream
          const localSource = audioContext.createMediaStreamSource(localStream);
          localSource.connect(destination);
          
          // Add remote stream
          const remoteSource = audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(destination);
          startRecording(destination.stream);
        }
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        handleError('Connection failed or disconnected');
      }
    };

    return pc;
  }, [sendSignalingMessage, updateStatus, handleError, startRecording, localStream, remoteStream, setupAudioAnalysis]);

  // Start the call (customer initiates)
  const startCall = useCallback(async () => {
    try {
      updateStatus('connecting');

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      setLocalStream(stream);
      setupAudioAnalysis(stream, 'local');

      // Initialize peer connection
      const pc = initializePeerConnection();

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignalingMessage('offer', offer);

      updateStatus('ringing');

      // Subscribe to real-time signaling via SSE
      subscribeToSignaling();

    } catch (error) {
      console.error('[WebRTC] Failed to start call:', error);
      handleError('Failed to access microphone or start call');
    }
  }, [initializePeerConnection, sendSignalingMessage, subscribeToSignaling, updateStatus, handleError, setupAudioAnalysis]);

  // Answer the call (admin accepts)
  const answerCall = useCallback(async () => {
    try {
      updateStatus('connecting');

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      setLocalStream(stream);
      setupAudioAnalysis(stream, 'local');

      // Initialize peer connection
      const pc = initializePeerConnection();

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Subscribe to real-time signaling via SSE (will receive offer)
      subscribeToSignaling();

    } catch (error) {
      console.error('[WebRTC] Failed to answer call:', error);
      handleError('Failed to access microphone');
    }
  }, [initializePeerConnection, subscribeToSignaling, updateStatus, handleError, setupAudioAnalysis]);

  // End the call
  const endCall = useCallback(() => {
    // Stop recording first
    stopRecording();

    // Send end signal
    if (status !== 'ended') {
      sendSignalingMessage('call-ended', {});
    }

    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Stop polling (if fallback was active)
    if (signalingPollingRef.current) {
      clearInterval(signalingPollingRef.current);
      signalingPollingRef.current = null;
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context to prevent memory leak
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(err => 
        console.warn('[WebRTC] Failed to close audio context:', err)
      );
      audioContextRef.current = null;
    }

    // Clear analyzer references
    localAnalyzerRef.current = null;
    remoteAnalyzerRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setLocalVolume(0);
    setRemoteVolume(0);
    updateStatus('ended');

    // Cleanup signaling messages
    fetch(`/api/calls/signal?callId=${callId}`, { method: 'DELETE' }).catch(err =>
      console.warn('[WebRTC] Failed to cleanup signaling:', err)
    );
  }, [callId, localStream, status, sendSignalingMessage, updateStatus, stopRecording]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup all resources
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      if (signalingPollingRef.current) {
        clearInterval(signalingPollingRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    status,
    localStream,
    remoteStream,
    isMuted,
    isRecording,
    localAudioLevel,
    remoteAudioLevel,
    startCall,
    answerCall,
    endCall,
    toggleMute,
  };
}
