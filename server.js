const express = require('express');
const Mux = require('@mux/mux-node');
const { StreamChat } = require('stream-chat');
const cors = require('cors');
const path = require('path');
const https = require('https');
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

// Find stream ID by playback ID
app.get('/api/playback/:playbackId/stream', async (req, res) => {
  try {
    const { playbackId } = req.params;
    
    // List all streams and find the one with matching playback ID
    const streams = await mux.video.liveStreams.list({ limit: 100 });
    
    const matchingStream = streams.data.find(stream => 
      stream.playback_ids && stream.playback_ids.some(pb => pb.id === playbackId)
    );
    
    if (!matchingStream) {
      return res.status(404).json({
        error: 'Stream not found',
        playbackId: playbackId,
        message: 'No stream found with this playback ID',
      });
    }
    
    res.json({
      streamId: matchingStream.id,
      playbackId: playbackId,
      status: matchingStream.status,
      streamKey: matchingStream.stream_key,
      createdAt: matchingStream.created_at,
    });
  } catch (error) {
    console.error('Error finding stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get saved video (asset) from a completed live stream
app.get('/api/stream/:streamId/recording', async (req, res) => {
  try {
    const stream = await mux.video.liveStreams.retrieve(req.params.streamId);
    
    // Check if stream has created any assets (recordings)
    if (!stream.recent_asset_ids || stream.recent_asset_ids.length === 0) {
      return res.json({
        streamId: req.params.streamId,
        hasRecording: false,
        message: 'No recording available. Stream may still be live or no recording was created.',
      });
    }
    
    // Get the most recent asset (recording)
    const assetId = stream.recent_asset_ids[0];
    const asset = await mux.video.assets.retrieve(assetId);
    
    // Get playback URL
    const playbackId = asset.playback_ids && asset.playback_ids.length > 0 
      ? asset.playback_ids[0].id 
      : null;
    
    res.json({
      streamId: req.params.streamId,
      hasRecording: true,
      assetId: asset.id,
      playbackId: playbackId,
      playbackUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
      embedUrl: playbackId ? `https://stream.mux.com/${playbackId}` : null,
      status: asset.status,
      duration: asset.duration,
      createdAt: asset.created_at,
    });
  } catch (error) {
    console.error('Error retrieving recording:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all recordings by playback ID (convenience endpoint)
app.get('/api/playback/:playbackId/recording', async (req, res) => {
  try {
    const { playbackId } = req.params;
    const { limit = 10 } = req.query; // Limit number of assets to retrieve
    
    // Find the stream with this playback ID
    const streams = await mux.video.liveStreams.list({ limit: 100 });
    const matchingStream = streams.data.find(stream => 
      stream.playback_ids && stream.playback_ids.some(pb => pb.id === playbackId)
    );
    
    if (!matchingStream) {
      return res.status(404).json({
        error: 'Stream not found',
        playbackId: playbackId,
      });
    }
    
    // Check if stream has created any assets (recordings)
    if (!matchingStream.recent_asset_ids || matchingStream.recent_asset_ids.length === 0) {
      // Still get live stream views even if no recordings
      const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64');
      let liveStreamViews = 0;
      try {
        const params = new URLSearchParams({
          'filters[]': `playback_id:${playbackId}`,
          'timeframe[]': '30:days'
        });
        
        const url = `https://api.mux.com/data/v1/video-views?${params.toString()}`;
        
        const liveStreamData = await new Promise((resolve, reject) => {
          https.get(url, {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          }, (response) => {
            let body = '';
            response.on('data', (chunk) => { body += chunk; });
            response.on('end', () => {
              try {
                const jsonData = JSON.parse(body);
                resolve({ statusCode: response.statusCode, data: jsonData });
              } catch (error) {
                resolve({ statusCode: 500, data: null });
              }
            });
          }).on('error', () => resolve({ statusCode: 500, data: null }));
        });
        
        if (liveStreamData.statusCode === 200 && liveStreamData.data) {
          liveStreamViews = liveStreamData.data.total_row_count || 0;
        }
      } catch (error) {
        console.error(`Error fetching live stream analytics:`, error);
      }
      
      return res.json({
        playbackId: playbackId,
        streamId: matchingStream.id,
        createdAt: matchingStream.created_at,
        hasRecordings: false,
        totalAssets: 0,
        liveStreamViews: liveStreamViews,
        recordingViews: 0,
        totalViews: liveStreamViews,
        recordings: [],
        message: 'No recording available. Stream may still be live or no recording was created.',
      });
    }
    
    const totalAssets = matchingStream.recent_asset_ids.length;
    const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64');
    
    // Get views for the LIVE STREAM (this is where most views come from)
    let liveStreamViews = 0;
    try {
      const params = new URLSearchParams({
        'filters[]': `playback_id:${playbackId}`,
        'timeframe[]': '30:days'
      });
      
      const url = `https://api.mux.com/data/v1/video-views?${params.toString()}`;
      
      const liveStreamData = await new Promise((resolve, reject) => {
        https.get(url, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }, (response) => {
          let body = '';
          response.on('data', (chunk) => { body += chunk; });
          response.on('end', () => {
            try {
              const jsonData = JSON.parse(body);
              resolve({ statusCode: response.statusCode, data: jsonData });
            } catch (error) {
              resolve({ statusCode: 500, data: null });
            }
          });
        }).on('error', () => resolve({ statusCode: 500, data: null }));
      });
      
      if (liveStreamData.statusCode === 200 && liveStreamData.data) {
        liveStreamViews = liveStreamData.data.total_row_count || 0;
      }
    } catch (error) {
      console.error(`Error fetching live stream analytics:`, error);
    }
    
    // Limit the number of assets to retrieve to avoid timeout
    const assetIdsToRetrieve = matchingStream.recent_asset_ids.slice(0, Math.min(parseInt(limit), 10));
    
    // Get assets (recordings) with analytics data
    const recordings = await Promise.all(
      assetIdsToRetrieve.map(async (assetId) => {
        try {
          const asset = await mux.video.assets.retrieve(assetId);
          const assetPlaybackId = asset.playback_ids && asset.playback_ids.length > 0 
            ? asset.playback_ids[0].id 
            : null;
          
          // Get view count for this recording (on-demand views after stream ended)
          let viewCount = 0;
          if (assetPlaybackId) {
            try {
              const params = new URLSearchParams({
                'filters[]': `playback_id:${assetPlaybackId}`,
                'timeframe[]': '30:days'
              });
              
              const url = `https://api.mux.com/data/v1/video-views?${params.toString()}`;
              
              const analyticsData = await new Promise((resolve, reject) => {
                https.get(url, {
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                  },
                }, (response) => {
                  let body = '';
                  response.on('data', (chunk) => { body += chunk; });
                  response.on('end', () => {
                    try {
                      const jsonData = JSON.parse(body);
                      resolve({ statusCode: response.statusCode, data: jsonData });
                    } catch (error) {
                      resolve({ statusCode: 500, data: null });
                    }
                  });
                }).on('error', () => resolve({ statusCode: 500, data: null }));
              });
              
              if (analyticsData.statusCode === 200 && analyticsData.data) {
                viewCount = analyticsData.data.total_row_count || 0;
              }
            } catch (error) {
              console.error(`Error fetching analytics for ${assetPlaybackId}:`, error);
            }
          }
          
          return {
            assetId: asset.id,
            playbackId: assetPlaybackId,
            playbackUrl: assetPlaybackId ? `https://stream.mux.com/${assetPlaybackId}.m3u8` : null,
            embedUrl: assetPlaybackId ? `https://stream.mux.com/${assetPlaybackId}` : null,
            status: asset.status,
            duration: asset.duration,
            createdAt: asset.created_at,
            recordingViews: viewCount,
          };
        } catch (error) {
          console.error(`Error retrieving asset ${assetId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any failed retrievals
    const validRecordings = recordings.filter(r => r !== null);
    
    // Calculate total views: live stream views + all recording views
    const recordingViews = validRecordings.reduce((sum, rec) => sum + (rec.recordingViews || 0), 0);
    const totalViews = liveStreamViews + recordingViews;
    
    res.json({
      streamId: matchingStream.id,
      streamPlaybackId: playbackId,
      createdAt: matchingStream.created_at,
      hasRecordings: validRecordings.length > 0,
      totalAssets: totalAssets,
      returnedRecordings: validRecordings.length,
      liveStreamViews: liveStreamViews,
      recordingViews: recordingViews,
      totalViews: totalViews,
      recordings: validRecordings,
      note: totalAssets > assetIdsToRetrieve.length ? `Showing ${assetIdsToRetrieve.length} of ${totalAssets} recordings. Use ?limit=N to get more.` : undefined,
    });
  } catch (error) {
    console.error('Error retrieving recordings:', error);
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

// Get current viewer count by stream ID (for active streams)
app.get('/api/stream-id/:streamId/viewers', async (req, res) => {
  try {
    const { streamId } = req.params;
    
    const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64');
    
    // Use timeseries endpoint with current-concurrent-viewers metric
    const params = new URLSearchParams({
      'filters[]': `live_stream_id:${streamId}`
    });
    
    const url = `https://api.mux.com/data/v1/monitoring/timeseries/current-concurrent-viewers?${params.toString()}`;
    console.log('🔍 Fetching viewers by stream ID (timeseries):', url);
    
    const data = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          try {
            console.log('📊 API status:', response.statusCode);
            const jsonData = JSON.parse(body);
            console.log('📊 API data:', JSON.stringify(jsonData, null, 2));
            resolve({ statusCode: response.statusCode, data: jsonData });
          } catch (error) {
            resolve({ statusCode: 500, data: null });
          }
        });
      }).on('error', () => resolve({ statusCode: 500, data: null }));
    });
    
    if (data.statusCode === 200 && data.data && data.data.data) {
      // Timeseries returns array of data points, get the latest
      const dataPoints = data.data.data;
      if (Array.isArray(dataPoints) && dataPoints.length > 0) {
        const latest = dataPoints[dataPoints.length - 1];
        const viewerCount = latest.concurrent_viewers || 0;
        console.log('✅ Viewer count from timeseries:', viewerCount);
        return res.json({
          streamId,
          currentViewers: viewerCount,
          timestamp: latest.date || new Date().toISOString(),
        });
      }
    }
    
    console.log('⚠️ No viewer data available');
    res.json({
      streamId,
      currentViewers: 0,
      timestamp: new Date().toISOString(),
      note: 'No viewer data available - stream may be offline or has no viewers',
    });
  } catch (error) {
    console.error('❌ Error getting viewer count:', error);
    res.status(500).json({ 
      error: error.message,
      streamId: req.params.streamId,
      currentViewers: 0,
    });
  }
});

// Get current viewer count for a stream (real-time monitoring)
app.get('/api/stream/:playbackId/viewers', async (req, res) => {
  try {
    const { playbackId } = req.params;
    
    const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64');
    
    // First, try to find the stream ID from playback ID
    let streamId = null;
    try {
      const streams = await mux.video.liveStreams.list({ limit: 100 });
      const matchingStream = streams.data.find(stream => 
        stream.playback_ids && stream.playback_ids.some(pb => pb.id === playbackId)
      );
      if (matchingStream) {
        streamId = matchingStream.id;
        console.log('🔍 Found stream ID:', streamId, 'for playback ID:', playbackId);
      }
    } catch (error) {
      console.error('⚠️ Error finding stream ID:', error);
    }
    
    // Try Method 1: Using stream_id filter (most reliable for live streams)
    if (streamId) {
      const streamIdParams = new URLSearchParams({
        'filters[]': `live_stream_id:${streamId}`
      });
      
      const streamIdUrl = `https://api.mux.com/data/v1/monitoring/metrics/current-concurrent-viewers?${streamIdParams.toString()}`;
      console.log('🔍 Trying with stream_id:', streamIdUrl);
      
      const streamIdData = await new Promise((resolve, reject) => {
        https.get(streamIdUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }, (response) => {
          let body = '';
          response.on('data', (chunk) => { body += chunk; });
          response.on('end', () => {
            try {
              console.log('📊 Stream ID API status:', response.statusCode);
              const jsonData = JSON.parse(body);
              console.log('📊 Stream ID API data:', JSON.stringify(jsonData, null, 2));
              resolve({ statusCode: response.statusCode, data: jsonData });
            } catch (error) {
              resolve({ statusCode: 500, data: null });
            }
          });
        }).on('error', () => resolve({ statusCode: 500, data: null }));
      });
      
      if (streamIdData.statusCode === 200 && streamIdData.data && streamIdData.data.data) {
        const viewerCount = streamIdData.data.data.value || 0;
        console.log('✅ Got viewers from stream_id:', viewerCount);
        return res.json({
          playbackId,
          streamId,
          currentViewers: viewerCount,
          timestamp: new Date().toISOString(),
          method: 'stream_id',
        });
      }
    }
    
    // Try Method 2: Using playback_id filter
    const playbackParams = new URLSearchParams({
      'filters[]': `playback_id:${playbackId}`
    });
    
    const playbackUrl = `https://api.mux.com/data/v1/monitoring/metrics/current-concurrent-viewers?${playbackParams.toString()}`;
    console.log('🔍 Trying with playback_id:', playbackUrl);
    
    const playbackData = await new Promise((resolve, reject) => {
      https.get(playbackUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          try {
            console.log('📊 Playback ID API status:', response.statusCode);
            const jsonData = JSON.parse(body);
            console.log('📊 Playback ID API data:', JSON.stringify(jsonData, null, 2));
            resolve({ statusCode: response.statusCode, data: jsonData });
          } catch (error) {
            resolve({ statusCode: 500, data: null });
          }
        });
      }).on('error', () => resolve({ statusCode: 500, data: null }));
    });
    
    if (playbackData.statusCode === 200 && playbackData.data && playbackData.data.data) {
      const viewerCount = playbackData.data.data.value || 0;
      console.log('✅ Got viewers from playback_id:', viewerCount);
      return res.json({
        playbackId,
        streamId,
        currentViewers: viewerCount,
        timestamp: new Date().toISOString(),
        method: 'playback_id',
      });
    }
    
    // No data from either endpoint
    console.log('⚠️ No viewer data from any endpoint');
    res.json({
      playbackId,
      streamId,
      currentViewers: 0,
      timestamp: new Date().toISOString(),
      note: 'No viewer data available - stream may be offline or has no viewers',
    });
  } catch (error) {
    console.error('❌ Error getting viewer count:', error);
    res.status(500).json({ 
      error: error.message,
      playbackId: req.params.playbackId,
      currentViewers: 0,
    });
  }
});

// Get historical analytics for a stream (video views)
app.get('/api/stream/:playbackId/analytics', async (req, res) => {
  try {
    const { playbackId } = req.params;
    const { timeframe = '7:days' } = req.query;
    
    const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64');
    
    // Use Mux Video Views API for historical data
    const params = new URLSearchParams({
      'filters[]': `playback_id:${playbackId}`,
      'timeframe[]': timeframe
    });
    
    const url = `https://api.mux.com/data/v1/video-views?${params.toString()}`;
    console.log('Fetching analytics from:', url);
    
    const data = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          try {
            console.log('Mux API response status:', response.statusCode);
            const jsonData = JSON.parse(body);
            console.log('Mux API analytics response:', JSON.stringify(jsonData, null, 2));
            resolve({ statusCode: response.statusCode, data: jsonData });
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
    
    if (data.statusCode !== 200) {
      return res.json({
        playbackId,
        timeframe,
        totalViews: 0,
        totalWatchTime: 0,
        averageViewDuration: 0,
        note: 'No analytics data available for this stream',
      });
    }
    
    // Calculate totals from video views
    const totalViews = data.data.total_row_count || 0;
    let totalWatchTime = 0;
    
    if (data.data.data && Array.isArray(data.data.data)) {
      totalWatchTime = data.data.data.reduce((sum, view) => {
        return sum + (view.watch_time || 0);
      }, 0);
    }
    
    const avgViewDuration = totalViews > 0 ? Math.round(totalWatchTime / totalViews / 1000) : 0;
    
    res.json({
      playbackId,
      timeframe,
      totalViews,
      totalWatchTime: Math.round(totalWatchTime / 1000), // Convert milliseconds to seconds
      averageViewDuration: avgViewDuration, // Average seconds per view
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ 
      error: error.message,
      playbackId: req.params.playbackId,
      totalViews: 0,
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
          API Endpoints: /api/create-stream, /api/streams, /api/stream/:id, /api/stream/:id/recording, /api/stream/:playbackId/viewers, /api/stream/:playbackId/analytics
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
