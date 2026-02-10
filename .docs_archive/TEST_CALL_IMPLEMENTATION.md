# Voice Call Implementation - Testing Guide

## Overview
This document outlines the complete voice call system for LuxeFinds, enabling customers to initiate test calls to admins with full two-way audio streaming and persistent session management.

---

## 🎯 Features Implemented

### 1. **Customer Test Call Initiation**
- **Component**: `TestCallButton` (`src/components/test-call-button.tsx`)
- **Features**:
  - One-click voice call initiation
  - Loading state feedback
  - Call status tracking
  - Permission request handling
  - Error notifications

### 2. **Admin Call Answer Interface**
- **Component**: `AdminVoiceCallOverlay` (`src/components/admin-voice-call-overlay.tsx`)
- **Features**:
  - Real-time call status monitoring
  - Two-way audio streaming
  - Volume control (0-100%)
  - Mute/unmute toggle
  - Call duration timer
  - Minimize/maximize functionality
  - Theme-consistent UI
  - Call session information display

### 3. **Session Management**
- **Context**: `VoiceCallProvider` (`src/context/voice-call-context.tsx`)
- **Features**:
  - Session state persistence across navigation
  - Automatic call duration tracking
  - Call status updates to database
  - Graceful cleanup on call end
  - Error handling and recovery

### 4. **Server Actions**
- **File**: `src/app/actions/admin-calls.ts`
- **New Function**: `answerCall()`
  - Updates call status from "ringing" to "active"
  - Records admin ID and name
  - Maintains audit trail

---

## 🧪 Testing Checklist

### Prerequisites
- Two browser windows/tabs (one for customer, one for admin)
- Microphone and speakers enabled
- Modern browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- Admin panel access

### Test 1: Customer Initiates Call
1. Navigate to `/contact` page
2. Scroll to "Live Support" section
3. Click "Test Voice Call" button
4. Grant microphone permission when prompted
5. Verify call status changes to "Connecting..."
6. Check admin panel for incoming "ringing" call

**Expected Results**:
- ✅ Call appears in admin calls dashboard
- ✅ Status shows "Ringing" with yellow badge
- ✅ "Answer" and "Decline" buttons visible
- ✅ Notification toast appears on customer side

### Test 2: Admin Answers Call
1. In admin panel (`/admin/calls`), locate ringing call
2. Click "Answer" button
3. Wait for connection establishment
4. Verify "Answering..." state transitions to connected

**Expected Results**:
- ✅ Button shows "Answering..." state
- ✅ Call status updates to "Active"
- ✅ Admin name appears in call record
- ✅ Voice call overlay opens
- ✅ Toast notification: "Call Connected"

### Test 3: Two-Way Audio Streaming
1. With active call established
2. Speak into microphone on customer side
3. Verify audio received on admin side
4. Speak into microphone on admin side
5. Verify audio received on customer side

**Expected Results**:
- ✅ Real-time audio transmission both ways
- ✅ No significant latency
- ✅ Clear audio quality
- ✅ Both parties hear each other

### Test 4: Volume Control (Admin)
1. During active call
2. Click volume button showing percentage
3. Slider appears
4. Drag slider to adjust volume (0-100%)
5. Verify audio volume changes in real-time

**Expected Results**:
- ✅ Volume slider displays
- ✅ Volume percentage updates
- ✅ Audio volume adjusts smoothly
- ✅ Can mute (0%) and unmute (100%)

### Test 5: Mute/Unmute
1. During active call
2. Click "Mute" button (admin side)
3. Verify button state changes to "Unmute"
4. Customer side: Try speaking, verify no sound from muted party
5. Click "Unmute" to restore

**Expected Results**:
- ✅ Mute button changes color (green to red)
- ✅ Button text updates
- ✅ Remote party cannot hear muted side
- ✅ Unmute restores audio

### Test 6: Call Duration Tracking
1. During active call
2. Note start time
3. Continue call for 30+ seconds
4. Verify duration timer increments
5. End call
6. Check admin dashboard for recorded duration

**Expected Results**:
- ✅ Timer shows MM:SS format
- ✅ Increments every second
- ✅ Duration persists in database
- ✅ Accurate to within 1 second

### Test 7: Minimize/Maximize (Admin)
1. During active call, admin clicks minimize button
2. Overlay shrinks to bottom-right corner
3. Verify connection continues
4. Click minimized panel to expand
5. Full overlay appears

**Expected Results**:
- ✅ Minimized state shows customer name and duration
- ✅ Green/yellow indicator shows connection status
- ✅ Radio icon pulsates
- ✅ Click to restore full overlay
- ✅ Audio continues uninterrupted

### Test 8: End Call (Customer Side)
1. Customer clicks "End Call" button on overlay
2. Verify call ends gracefully
3. Admin receives call termination
4. Check dashboard: status shows "Ended"

**Expected Results**:
- ✅ Call marked as "Ended"
- ✅ Duration recorded
- ✅ Admin overlay closes
- ✅ Toast: "Call Ended"
- ✅ Can initiate new call immediately

### Test 9: End Call (Admin Side)
1. Admin clicks "End Call" button
2. Verify call ends immediately
3. Customer overlay closes
4. Both parties can initiate new calls

**Expected Results**:
- ✅ Immediate disconnection
- ✅ Clean resource cleanup
- ✅ No hanging connections
- ✅ Both parties can call again

### Test 10: Decline Call (Admin)
1. In admin dashboard, locate ringing call
2. Click red "Decline" button
3. Verify status changes to "Declined"
4. Customer receives notification

**Expected Results**:
- ✅ Call status: "Declined"
- ✅ Customer sees decline notification
- ✅ Can initiate new call
- ✅ Admin can answer different calls

### Test 11: Theme Consistency
1. Customer initiates call
2. Verify call overlay uses dark theme
3. Admin answers call
4. Verify admin overlay matches LuxeFinds dark theme
5. Minimized state maintains theme

**Expected Results**:
- ✅ Colors match primary brand colors
- ✅ Typography uses font-headline
- ✅ Spacing consistent with design system
- ✅ Smooth transitions and animations
- ✅ Dark mode maintained throughout

### Test 12: Session Persistence
1. Customer initiates call
2. Admin answers
3. Customer navigates to different page (stays in call)
4. Admin navigates to different page (stays in call)
5. Verify audio continues
6. Return to original pages

**Expected Results**:
- ✅ Call overlay persists across navigation
- ✅ Audio continues uninterrupted
- ✅ Context state maintained
- ✅ No memory leaks on navigation
- ✅ Cleanup occurs properly on end

### Test 13: Microphone Permission Error
1. Deny microphone permission on first attempt
2. Try to initiate call again
3. Verify error message appears
4. Grant permission
5. Try again - should work

**Expected Results**:
- ✅ Clear error message
- ✅ No silent failures
- ✅ User can retry after permission granted
- ✅ Proper error logging

### Test 14: Network Disconnection Recovery
1. Start active call
2. Simulate poor network (browser DevTools)
3. Verify graceful degradation
4. Restore network
5. Verify reconnection attempt

**Expected Results**:
- ✅ Signaling resilience
- ✅ No complete failure on temporary disconnect
- ✅ Attempt to recover
- ✅ User informed of connection issues

### Test 15: Multiple Admin Calls
1. Have multiple ringing calls in queue
2. Admin answers first call
3. While in call, second call appears in list
4. After ending first call, answer second
5. Verify no conflicts

**Expected Results**:
- ✅ Only one active call per admin
- ✅ Other calls queue in dashboard
- ✅ No audio conflicts
- ✅ Clean transitions between calls

---

## 📊 Performance Metrics to Monitor

1. **Call Setup Time**: Target < 3 seconds
2. **Audio Latency**: Target < 500ms one-way
3. **CPU Usage**: Should not exceed 15% during call
4. **Memory Usage**: Should not leak > 50MB over 30 min call
5. **Bandwidth**: ~50-100 kbps each direction

---

## 🐛 Known Limitations & Future Enhancements

### Current Limitations
- In-memory signaling (production should use Redis/message queue)
- No audio recording yet (see `recordingUrl` field in schema)
- No screen sharing
- No video
- Single admin per call

### Future Enhancements
1. Audio recording and storage
2. Call history and analytics
3. Call transfer between admins
4. Hold/resume functionality
5. Call transcription with AI
6. Video support
7. Screen sharing
8. Multi-party conferencing

---

## 🔧 Integration Points

### Customer Contact Page
- **File**: `src/app/contact/page.tsx`
- **Component**: `<TestCallButton />`
- **Purpose**: Entry point for customers to initiate calls

### Admin Calls Dashboard
- **File**: `src/app/admin/calls/page.tsx`
- **Features**: List of calls, answer/decline buttons
- **Component**: `<AdminVoiceCallOverlay />`

### Database Schema
- **Table**: `VoiceCallSession`
- **Fields**: status, adminId, adminName, duration, recordingUrl

### API Routes
- **`/api/calls/session`**: Create/update call sessions
- **`/api/calls/signal`**: WebRTC signaling messages
- **`/api/calls/recording`**: Audio recording handling

---

## 📝 Key Files Modified/Created

### New Files
- `src/components/test-call-button.tsx` - Customer call button
- `src/components/admin-voice-call-overlay.tsx` - Admin call interface

### Modified Files
- `src/app/admin/calls/page.tsx` - Added answer/decline UI
- `src/app/actions/admin-calls.ts` - Added `answerCall()` action
- `src/app/contact/page.tsx` - Added test call section
- `src/context/voice-call-context.tsx` - Enhanced session tracking

---

## 🚀 Deployment Notes

1. **Environment Variables**: Ensure TURN credentials are configured
2. **CORS**: Verify API routes allow proper cross-origin requests
3. **SSL/TLS**: Required for microphone access in production
4. **Database**: Ensure VoiceCallSession table exists
5. **Monitoring**: Set up logging for call duration and errors

---

## 💡 Testing Tips

- Use `localhost:3000` for development
- Open browser DevTools → Application tab to monitor WebRTC connections
- Use console logs to track call flow
- Test with different network conditions
- Try mobile browsers (Chrome, Safari on iOS 14+)
- Record tests for documentation

---

## 📞 Support & Troubleshooting

### Common Issues

**No audio heard**
- Check microphone permissions
- Verify speaker is not muted
- Try different browser/device
- Check console for errors

**Call won't connect**
- Refresh page and retry
- Check network connectivity
- Verify browser supports WebRTC
- Check TURN server status

**High latency**
- Close other network applications
- Move closer to WiFi router
- Try wired connection
- Check ISP throttling

**Memory leak**
- Monitor browser DevTools Memory tab
- Check for proper cleanup on call end
- Verify event listeners removed
- Check for circular references

---

## 📞 Contact

For issues or questions about the voice call implementation:
1. Check browser console for errors
2. Review implementation comments in code
3. Test with different browser/network conditions
4. Create issue with detailed reproduction steps
