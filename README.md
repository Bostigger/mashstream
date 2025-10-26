# 🏆 Tournament Streaming Backend

Live streaming backend for tournaments using Mux - stream via OBS just like YouTube!

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Mux API
1. Go to [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens)
2. Create a new access token with **Read** and **Write** permissions
3. Copy your Token ID and Token Secret

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your Mux credentials:
```
MUX_TOKEN_ID=your_actual_token_id
MUX_TOKEN_SECRET=your_actual_token_secret
PORT=3001
```

### 4. Start the Server
```bash
npm start
```

Server will be running at `http://localhost:3001` 🎉

---

## 📡 API Endpoints

### Create New Stream
```http
POST /api/create-stream
```
**Response:**
```json
{
  "streamKey": "abc123...",
  "streamId": "xyz789...",
  "playbackId": "def456...",
  "rtmpUrl": "rtmps://global-live.mux.com:443/app"
}
```

### Get Stream Status
```http
GET /api/stream/:streamId
```

### List All Streams
```http
GET /api/streams
```

### Delete Stream
```http
DELETE /api/stream/:streamId
```

### Health Check
```http
GET /health
```

---

## 🎥 OBS Setup

1. **Create a stream** via your admin page (see frontend integration below)
2. **Open OBS Studio**
3. Go to **Settings → Stream**
4. Configure:
   - **Service:** Custom
   - **Server:** `rtmps://global-live.mux.com:443/app`
   - **Stream Key:** Use the key from your created stream
5. Click **Start Streaming** in OBS!

---

## 🌐 Frontend Integration (Next.js)

### Install Mux Player
```bash
npm install @mux/mux-player-react
```

### Admin Page - Create Stream
Create `app/admin/stream/page.jsx`:

```jsx
'use client';
import { useState } from 'react';

export default function StreamAdmin() {
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);

  const createStream = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/create-stream', {
        method: 'POST',
      });
      const data = await res.json();
      setStreamData(data);
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏆 Tournament Stream Setup</h1>
      
      <button
        onClick={createStream}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating Stream...' : 'Create New Stream'}
      </button>

      {streamData && (
        <div className="mt-8 space-y-4">
          <div className="bg-gray-900 text-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">🎥 OBS Configuration</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Server URL:</p>
                <code className="bg-black px-3 py-2 rounded block overflow-x-auto">
                  {streamData.rtmpUrl}
                </code>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Stream Key:</p>
                <code className="bg-black px-3 py-2 rounded block overflow-x-auto">
                  {streamData.streamKey}
                </code>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h3 className="font-bold text-green-900 mb-2">✅ Stream Created!</h3>
            <p className="text-green-800">
              Viewers can watch at: <strong>/watch/{streamData.playbackId}</strong>
            </p>
            <p className="text-sm text-green-700 mt-2">
              Stream ID: {streamData.streamId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Viewer Page - Watch Stream
Create `app/watch/[playbackId]/page.jsx`:

```jsx
'use client';
import MuxPlayer from '@mux/mux-player-react';
import { useParams } from 'next/navigation';

export default function WatchStream() {
  const params = useParams();
  const playbackId = params.playbackId;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-white text-3xl font-bold mb-4">
          🏆 Tournament Live Stream
        </h1>
        
        <MuxPlayer
          streamType="live"
          playbackId={playbackId}
          metadata={{
            video_title: "Tournament Match",
          }}
          autoPlay
          muted={false}
          className="w-full"
        />

        <div className="mt-6 text-white">
          <h2 className="text-xl font-bold mb-4">💬 Chat</h2>
          <p className="text-gray-400">Chat feature coming soon!</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚢 Deployment Options

### Railway (Recommended - Free Tier)
1. Push your code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Connect your repository
4. Add environment variables in Railway dashboard
5. Deploy! 🚀

### Render
1. Connect GitHub repo
2. Select "Web Service"
3. Build: `npm install`
4. Start: `npm start`
5. Add environment variables

### Heroku
```bash
heroku create tournament-backend
heroku config:set MUX_TOKEN_ID=your_token_id
heroku config:set MUX_TOKEN_SECRET=your_token_secret
git push heroku main
```

---

## 🔧 Development

```bash
# Start server
npm start

# Or for development with auto-reload (add nodemon)
npm install -D nodemon
# Update package.json: "dev": "nodemon server.js"
npm run dev
```

---

## 📝 How It Works

1. **Backend** manages Mux API calls (creating streams, getting status)
2. **OBS** streams to Mux using RTMP (same as YouTube/Twitch)
3. **Mux** processes the stream and makes it available via CDN
4. **Viewers** watch using Mux Player on your website
5. **No delays** - low latency streaming!

---

## 🎯 Features

- ✅ Create live streams programmatically
- ✅ OBS integration (stream like YouTube)
- ✅ Low latency playback
- ✅ Auto-recording to assets
- ✅ Multiple concurrent streams
- ✅ Stream status monitoring
- ✅ CORS enabled for frontend

---

## 📚 Resources

- [Mux Live Streaming Docs](https://docs.mux.com/guides/video/stream-live-video)
- [Mux Node SDK](https://github.com/muxinc/mux-node-sdk)
- [OBS Studio Download](https://obsproject.com/)

---

## 🆘 Troubleshooting

### "Stream key invalid"
- Make sure you're using `rtmps://` (with 's') not `rtmp://`
- Copy the exact stream key without spaces

### "Connection refused"
- Check if backend is running on correct port
- Update frontend fetch URL if deploying

### "No video showing"
- Stream takes 5-10 seconds to start after OBS connects
- Check stream status: `GET /api/stream/:streamId`

---

## 📄 License

ISC
