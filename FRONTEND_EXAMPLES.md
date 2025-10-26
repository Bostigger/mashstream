# 🎨 Frontend Examples

Quick copy-paste examples for integrating with your Next.js tournament site.

## 📦 Install Mux Player
```bash
npm install @mux/mux-player-react
```

---

## 🔧 Admin Stream Creation Page

### Pages Directory: `pages/admin/stream.jsx`
### App Directory: `app/admin/stream/page.jsx`

```jsx
'use client';
import { useState } from 'react';

export default function StreamAdmin() {
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createStream = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/create-stream', {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Failed to create stream');
      
      const data = await res.json();
      setStreamData(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          🎥 Stream Management
        </h1>
        
        <button
          onClick={createStream}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg transition-all"
        >
          {loading ? '⏳ Creating Stream...' : '✨ Create New Stream'}
        </button>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
            ⚠️ Error: {error}
          </div>
        )}

        {streamData && (
          <div className="mt-8 space-y-6">
            {/* OBS Configuration */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">
                🎬 OBS Studio Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Server URL:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-900 text-green-400 px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto">
                      {streamData.rtmpUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(streamData.rtmpUrl)}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Stream Key:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-900 text-green-400 px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto">
                      {streamData.streamKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(streamData.streamKey)}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  💡 <strong>In OBS:</strong> Settings → Stream → Service: "Custom" → 
                  Paste the URLs above → Start Streaming!
                </p>
              </div>
            </div>

            {/* Viewer Info */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
              <h3 className="font-bold text-green-400 text-xl mb-3">
                ✅ Stream Created Successfully!
              </h3>
              <div className="space-y-2 text-green-300">
                <p>
                  📺 <strong>Watch URL:</strong>{' '}
                  <a 
                    href={`/watch/${streamData.playbackId}`}
                    target="_blank"
                    className="underline hover:text-green-200"
                  >
                    /watch/{streamData.playbackId}
                  </a>
                </p>
                <p className="text-sm">
                  🆔 Stream ID: <code className="bg-gray-900 px-2 py-1 rounded">{streamData.streamId}</code>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📺 Viewer Watch Page

### Pages Directory: `pages/watch/[playbackId].jsx`
### App Directory: `app/watch/[playbackId]/page.jsx`

```jsx
'use client';
import MuxPlayer from '@mux/mux-player-react';
import { useParams } from 'next/navigation'; // or 'next/router' for pages directory
import { useState, useEffect } from 'react';

export default function WatchStream() {
  const params = useParams();
  const playbackId = params.playbackId;
  const [isLive, setIsLive] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-4xl font-bold mb-2">
            🏆 Tournament Live Stream
          </h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'
            }`}>
              {isLive ? '🔴 LIVE' : '⚫ Offline'}
            </span>
            <span className="text-gray-400">
              Watch the tournament action unfold!
            </span>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl mb-6">
          <MuxPlayer
            streamType="live"
            playbackId={playbackId}
            metadata={{
              video_title: "Tournament Match Stream",
              viewer_user_id: "viewer-" + Math.random(),
            }}
            autoPlay
            muted={false}
            className="w-full aspect-video"
            accentColor="#3B82F6"
            onLoadStart={() => console.log('Stream loading...')}
            onPlaying={() => setIsLive(true)}
            onWaiting={() => setIsLive(false)}
          />
        </div>

        {/* Info Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chat placeholder */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">💬 Live Chat</h2>
            <div className="bg-gray-900 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-400">Chat feature coming soon!</p>
            </div>
          </div>

          {/* Tournament Info */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">📋 Match Info</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Tournament:</span>
                <span className="font-semibold">Winter Championship</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Match:</span>
                <span className="font-semibold">Semi-Finals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Viewers:</span>
                <span className="font-semibold text-green-400">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎮 Stream List/Dashboard (Bonus)

```jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StreamsDashboard() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/streams');
      const data = await res.json();
      setStreams(data.data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading streams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          🎬 Active Streams
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <Link
              key={stream.id}
              href={`/watch/${stream.playback_ids[0]?.id}`}
              className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  stream.status === 'active' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {stream.status === 'active' ? '🔴 LIVE' : '⚫ Idle'}
                </span>
              </div>
              
              <h3 className="text-white font-semibold text-lg mb-2">
                Stream {stream.id.slice(0, 8)}...
              </h3>
              
              <p className="text-gray-400 text-sm">
                Created: {new Date(stream.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>

        {streams.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No streams available. Create one in the admin panel!
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔄 Update Backend URL for Production

When you deploy the backend, update the fetch URLs:

```javascript
// Development
const API_URL = 'http://localhost:3001';

// Production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.railway.app';

// Usage
const res = await fetch(`${API_URL}/api/create-stream`, {
  method: 'POST',
});
```

Add to your Next.js `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

And in production (Vercel, etc.):
```
NEXT_PUBLIC_API_URL=https://your-deployed-backend.com
```
