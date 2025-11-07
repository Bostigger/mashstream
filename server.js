const express = require('express');
const Mux = require('@mux/mux-node');
const { StreamChat } = require('stream-chat');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (HTML pages)
app.use(express.static(path.join(__dirname)));

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Initialize Stream Chat (for chat token generation)
let streamChatClient = null;
if (process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET) {
  streamChatClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY,
    process.env.STREAM_API_SECRET
  );
}

// Create new stream
app.post('/api/create-stream', async (req, res) => {
  try {
    const stream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: { playback_policy: ['public'] },
      reconnect_window: 60,
    });

    res.json({
      streamKey: stream.stream_key,
      streamId: stream.id,
      playbackId: stream.playback_ids[0].id,
      rtmpUrl: 'rtmps://global-live.mux.com:443/app',
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get stream status
app.get('/api/stream/:streamId', async (req, res) => {
  try {
    const stream = await mux.video.liveStreams.retrieve(req.params.streamId);
    res.json({
      status: stream.status,
      playbackId: stream.playback_ids[0].id,
    });
  } catch (error) {
    console.error('Error retrieving stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all streams
app.get('/api/streams', async (req, res) => {
  try {
    const streams = await mux.video.liveStreams.list({ limit: 100 });
    res.json(streams);
  } catch (error) {
    console.error('Error listing streams:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete stream
app.delete('/api/stream/:streamId', async (req, res) => {
  try {
    await mux.video.liveStreams.delete(req.params.streamId);
    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Error deleting stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current viewer count for a stream
app.get('/api/stream/:playbackId/viewers', async (req, res) => {
  try {
    const { playbackId } = req.params;
    
    // Use Mux REST API directly for real-time metrics
    const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64');
    
    const response = await fetch(
      `https://api.mux.com/data/v1/metrics/current-concurrent-viewers?filters[]=playback_id:${playbackId}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    // Extract viewer count from response
    const viewerCount = data.data && data.data.length > 0 
      ? data.data[0].value || 0 
      : 0;

    res.json({
      playbackId,
      currentViewers: viewerCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting viewer count:', error);
    res.status(500).json({ 
      error: error.message,
      playbackId: req.params.playbackId,
      currentViewers: 0,
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tournament streaming backend is running' });
});

// Generate Stream Chat token
app.post('/api/chat-token', async (req, res) => {
  try {
    const { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    if (!streamChatClient) {
      return res.status(500).json({ 
        error: 'Stream Chat not configured. Add STREAM_API_KEY and STREAM_API_SECRET to .env' 
      });
    }

    // Generate token for the user
    const token = streamChatClient.createToken(userId);

    res.json({ 
      token,
      apiKey: process.env.STREAM_API_KEY 
    });
  } catch (error) {
    console.error('Error generating chat token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🏆 Tournament Streaming Backend</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          text-align: center;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
        }
        a {
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s;
        }
        a:hover { transform: translateY(-2px); }
        .status { color: #10b981; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏆 Tournament Streaming Backend</h1>
        <p class="status">✅ Backend is running!</p>
        <div class="links">
          <a href="/test.html">🎥 Stream Manager (Create Streams)</a>
          <a href="/watch.html">📺 Watch Stream Example</a>
          <a href="/health">🏥 Health Check API</a>
        </div>
        <p style="margin-top: 2rem; color: #6b7280; font-size: 0.9rem;">
          API Endpoints: /api/create-stream, /api/streams, /api/stream/:id, /api/stream/:playbackId/viewers
        </p>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);

});
