const express = require('express');
const Mux = require('@mux/mux-node');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tournament streaming backend is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
