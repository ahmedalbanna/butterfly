# 🎙️ Voice Call System - Quick Start Guide

## What's New

LuxeFinds now has a complete **two-way voice call system** enabling customers to test call admins with real-time audio streaming, volume control, and persistent session management.

---

## 🚀 Quick Test (5 minutes)

### Step 1: Start the Application
```bash
npm run dev
```
Visit `http://localhost:3000`

### Step 2: Customer Initiates Call
1. Go to `/contact` page
2. Scroll down to **"Live Support"** card (highlighted in primary color)
3. Click **"Test Voice Call"** button
4. Grant microphone permission when prompted
5. Wait for "Connecting..." status

### Step 3: Admin Answers Call
1. Open admin panel: `http://localhost:3000/admin/calls`
2. Look for call with **"Ringing"** status (yellow badge)
3. Click **green "Answer"** button
4. Verify **"Answering..."** state
5. Voice call overlay opens automatically

### Step 4: Test Audio Communication
1. **Customer**: Speak into microphone
2. **Admin**: Should hear audio in overlay
3. **Admin**: Speak into microphone  
4. **Customer**: Should hear audio in overlay
5. Both should hear each other clearly

### Step 5: Test Controls (Admin)
- **Mute/Unmute**: Toggle microphone on/off
- **Volume**: Click volume % to show slider, adjust 0-100%
- **Minimize**: Click minimize button → call shrinks to corner
- **Duration**: Watch timer increment in real-time

### Step 6: End Call
- Either side can click **"End Call"** button
- Call status updates to "Ended"
- Duration is recorded
- Can start new call immediately

---

## 📁 File Structure

```
src/
├── components/
│   ├── test-call-button.tsx              ✨ NEW: Customer call button
│   ├── admin-voice-call-overlay.tsx      ✨ NEW: Admin call interface
│   └── voice-call-overlay.tsx            (Customer overlay)
├── context/
│   └── voice-call-context.tsx            (Enhanced with session tracking)
├── app/
│   ├── contact/page.tsx                  (Updated with test call section)
│   ├── admin/calls/page.tsx              (Updated with answer/decline buttons)
│   └── actions/admin-calls.ts            (Added answerCall action)
└── hooks/
    └── use-webrtc-call.ts                (WebRTC peer connection logic)
```

---

## 🔌 API Routes

### Call Session Management
```
POST   /api/calls/session     - Create new call
GET    /api/calls/session     - Get call details
PATCH  /api/calls/session     - Update call status
```

### WebRTC Signaling
```
POST   /api/calls/signal      - Send signaling message
GET    /api/calls/signal      - Poll for signaling messages
DELETE /api/calls/signal      - Clear signaling messages
```

### Call Recording (Future)
```
POST   /api/calls/recording   - Save recording
GET    /api/calls/recording   - Retrieve recording
```

---

## 🎨 UI Components

### TestCallButton
**Location**: Contact page  
**Props**: None (uses context)  
**States**:
- Idle: "Test Voice Call" with phone icon
- Initiating: "Initiating..." with spinner
- In Call: "In Call" (disabled)

### AdminVoiceCallOverlay
**Location**: Admin calls page  
**Props**:
- `callSession`: Current call details
- `onClose`: Callback on call end
- `isOpen`: Boolean to show/hide

**Features**:
- Real-time status (connecting, connected, ended)
- Mute/unmute toggle
- Volume slider (0-100%)
- Call duration timer
- Customer info display
- Minimize/maximize
- End call button

---

## 📊 Database Fields

### VoiceCallSession
```typescript
{
  id: string           // Unique call ID
  customerId: string   // Customer identifier
  customerName: string // Customer display name
  status: string       // ringing | active | ended | missed | declined
  startedAt: DateTime  // Call start time
  endedAt?: DateTime   // Call end time
  duration?: number    // Duration in seconds
  adminId?: string     // Admin who answered
  adminName?: string   // Admin display name
  recordingUrl?: string // Recording file URL
  recordingSize?: number // Recording size in bytes
}
```

---

## 🔊 Audio Streaming

### How It Works
1. **Customer initiates call** → Creates `VoiceCallSession` with status "ringing"
2. **Admin answers** → Status changes to "active"
3. **WebRTC negotiation** → Offer/answer/ICE candidates exchanged
4. **Peer connection established** → Audio streams flow
5. **Call ends** → Session updated with duration, status "ended"

### Audio Tracks
- **Local stream**: Customer/Admin's microphone input
- **Remote stream**: Other party's audio output
- **Volume control**: Adjusts HTMLAudioElement volume (0.0 - 1.0)
- **Mute**: Stops audio track sending

---

## 🛠️ Configuration

### TURN Servers (for NAT/Firewall)
**File**: `src/hooks/use-webrtc-call.ts`

```typescript
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
```

For production, use your own TURN server (credentials in `.env`)

### Call Polling Interval
**File**: `src/app/admin/calls/page.tsx`

```typescript
// Refresh every 5 seconds
const interval = setInterval(loadData, 5000);
```

Adjust interval based on needs and server load.

---

## 🧪 Quick Tests

### Test 1: Basic Call Flow (2 min)
```
1. Open /contact in Tab 1
2. Open /admin/calls in Tab 2
3. Click "Test Voice Call" in Tab 1
4. See ringing call in Tab 2
5. Click "Answer" in Tab 2
6. Both sides hear each other
7. Click "End Call"
```

### Test 2: Volume Control (1 min)
```
1. During active call (admin side)
2. Click volume button (shows %)
3. Slider appears
4. Drag to 0% - audio mutes
5. Drag to 100% - audio unmaxed
6. Drag to 50% - audio quieter
```

### Test 3: Minimize Feature (1 min)
```
1. During active call (admin side)
2. Click minimize button
3. Overlay shrinks to bottom-right
4. Notice blinking indicator
5. Click minimized panel
6. Overlay expands again
7. Audio continues uninterrupted
```

### Test 4: Multi-call Queue (2 min)
```
1. Have 2 browser windows for customers
2. Both initiate calls
3. Admin dashboard shows both "Ringing"
4. Admin answers first call
5. Second call still shows "Ringing"
6. End first call
7. Answer second call
```

---

## ⚡ Performance Tips

- **Disable audio echo cancellation** if using speakers/headphones (prevents feedback)
- **Use headphones** for best experience
- **Close unnecessary tabs** to reduce CPU usage
- **Test on wired connection** for best audio quality
- **Use modern browser** (Chrome 90+, Firefox 88+, Safari 15+)

---

## 🐛 Troubleshooting

### "No Audio Heard"
- ✅ Check microphone is not muted in OS
- ✅ Check browser permissions for microphone
- ✅ Check volume is not 0%
- ✅ Try different browser
- ✅ Check console for errors (F12)

### "Call Won't Connect"
- ✅ Refresh page and retry
- ✅ Check internet connection
- ✅ Verify TURN server is reachable
- ✅ Check firewall/VPN settings
- ✅ Try different network

### "High Latency/Delay"
- ✅ Check network quality (use speedtest)
- ✅ Move closer to WiFi
- ✅ Switch to wired connection
- ✅ Close bandwidth-heavy applications
- ✅ Try different time when network is less congested

### "Audio Breaks/Choppy"
- ✅ Reduce browser tabs/applications
- ✅ Restart browser
- ✅ Check CPU usage (should be < 20%)
- ✅ Try different network/location
- ✅ Check microphone hardware

### "Error in Console"
- ✅ Note exact error message
- ✅ Screenshot console output
- ✅ Check network tab for failed requests
- ✅ Verify API routes are accessible
- ✅ Check database connection

---

## 📈 Monitoring

### Browser DevTools
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for [Voice Call] and [WebRTC] logs
4. Check for errors and warnings
5. Monitor Performance tab for CPU/memory
```

### Admin Dashboard
```
1. Go to /admin/calls
2. Monitor call statistics
3. Check "Incoming Calls" alert
4. Review call history
5. Verify durations recorded
```

### Database
```sql
-- View all calls
SELECT * FROM VoiceCallSession ORDER BY startedAt DESC;

-- View active calls
SELECT * FROM VoiceCallSession WHERE status = 'active';

-- View call statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(duration) as avg_duration
FROM VoiceCallSession
GROUP BY status;
```

---

## 🔴 Redis Signaling Setup

The voice call system uses **Redis** for WebRTC signaling with **Server-Sent Events (SSE)** for real-time message delivery.

### Features
- ✅ **Persistent Storage**: Signaling messages survive server restarts
- ✅ **Horizontal Scalability**: Multiple Next.js instances can share signaling state
- ✅ **Real-Time Delivery**: Redis Pub/Sub eliminates polling delays
- ✅ **Automatic Cleanup**: Messages expire after 10 minutes (TTL)
- ✅ **Fallback Support**: Automatically falls back to polling if SSE fails

### Quick Start

1. **Start Redis** (already configured in docker-compose.yml):
```bash
docker compose up -d redis
```

2. **Verify Redis is running**:
```bash
docker compose exec redis redis-cli ping
# Expected: PONG
```

3. **Environment Variable** (optional):
```bash
# .env (defaults to redis://localhost:6379)
REDIS_URL=redis://localhost:6379
```

### How It Works

**Message Flow:**
```
Customer → POST /api/calls/signal → Redis List + Pub/Sub → SSE → Admin
Admin → POST /api/calls/signal → Redis List + Pub/Sub → SSE → Customer
```

**Redis Keys:**
- `signal:{callId}:messages` - List of signaling messages (offers, answers, ICE candidates)
- `signal:{callId}:channel` - Pub/Sub channel for real-time notifications

**Client Behavior:**
1. Connects to `/api/calls/signal/subscribe` via EventSource (SSE)
2. Receives real-time notifications via Redis Pub/Sub
3. Falls back to polling `/api/calls/signal` (GET) if SSE fails

### Architecture Files
- `src/lib/redis.ts` - Redis client singleton with connection management
- `src/app/api/calls/signal/route.ts` - Signaling API (POST/GET/DELETE)
- `src/app/api/calls/signal/subscribe/route.ts` - SSE endpoint for real-time notifications
- `src/hooks/use-webrtc-call.ts` - WebRTC hook with SSE integration

### Production Configuration

**Redis Settings in docker-compose.yml:**
- 256MB memory limit with LRU eviction policy
- AOF persistence enabled
- Health checks configured

**For Production Deployment:**
```bash
# Use Redis Cloud, AWS ElastiCache, or similar
REDIS_URL=rediss://username:password@your-redis-host:6379
```

---

## 🚀 Production Checklist

- [ ] Use HTTPS (required for microphone access)
- [ ] Configure custom TURN server with credentials in `.env`
- [x] ✅ Set up Redis for signaling (using Server-Sent Events + Pub/Sub)
- [ ] Enable audio recording with transcription
- [ ] Add call recording storage (S3/CloudStorage)
- [ ] Set up monitoring and alerting
- [ ] Configure auto-scaling for multiple admins
- [ ] Add call queue management
- [ ] Implement call transfer between admins
- [ ] Add call transcription with AI
- [ ] Set up analytics and reporting

---

## 📚 Documentation

For detailed testing procedures, see: `TEST_CALL_IMPLEMENTATION.md`

For architecture details, see: `src/hooks/use-webrtc-call.ts` comments

---

## 🎉 That's It!

You now have a fully functional two-way voice call system. Test it out and enjoy!

**Questions?** Check the code comments or the TEST_CALL_IMPLEMENTATION.md file for comprehensive guidance.
