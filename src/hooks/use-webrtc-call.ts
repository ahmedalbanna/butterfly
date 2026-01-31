import { useEffect, useRef, useState, useCallback } from 'react';

export type CallStatus = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error';

interface WebRTCCallOptions {
  callId: string;
  role: 'customer' | 'admin';
  onStatusChange?: (status: CallStatus) => void;
  onError?: (error: string) => void;
}

// STUN server configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTCCall({ callId, role, onStatusChange, onError }: WebRTCCallOptions) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingPollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastSignalingTimestampRef = useRef<number>(0);

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

  // Poll for signaling messages
  const pollSignalingMessages = useCallback(async () => {
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
      setRemoteStream(event.streams[0]);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        updateStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        handleError('Connection failed or disconnected');
      }
    };

    return pc;
  }, [sendSignalingMessage, updateStatus, handleError]);

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

      // Start polling for signaling messages
      signalingPollingRef.current = setInterval(() => {
        pollSignalingMessages();
      }, 500); // Poll every 500ms during call setup

    } catch (error) {
      console.error('[WebRTC] Failed to start call:', error);
      handleError('Failed to access microphone or start call');
    }
  }, [initializePeerConnection, sendSignalingMessage, pollSignalingMessages, updateStatus, handleError]);

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

      // Initialize peer connection
      const pc = initializePeerConnection();

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Start polling for signaling messages (will receive offer)
      signalingPollingRef.current = setInterval(() => {
        pollSignalingMessages();
      }, 500);

    } catch (error) {
      console.error('[WebRTC] Failed to answer call:', error);
      handleError('Failed to access microphone');
    }
  }, [initializePeerConnection, pollSignalingMessages, updateStatus, handleError]);

  // End the call
  const endCall = useCallback(() => {
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

    // Stop polling
    if (signalingPollingRef.current) {
      clearInterval(signalingPollingRef.current);
      signalingPollingRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    updateStatus('ended');

    // Cleanup signaling messages
    fetch(`/api/calls/signal?callId=${callId}`, { method: 'DELETE' });
  }, [callId, localStream, status, sendSignalingMessage, updateStatus]);

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
      if (status !== 'idle' && status !== 'ended') {
        endCall();
      }
    };
  }, []);

  return {
    status,
    localStream,
    remoteStream,
    isMuted,
    startCall,
    answerCall,
    endCall,
    toggleMute,
  };
}
