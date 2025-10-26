# 🎥 OBS Setup Guide for Tournament Streaming

## 📋 What You'll Stream

For a tournament, you typically need:
- 🎮 **Game footage** (the match being played)
- 🎥 **Player cameras** (optional - show player reactions)
- 📊 **Overlays** (scores, player names, tournament branding)
- 🎤 **Audio** (game sound + commentary)

---

## 🚀 Quick Start: Basic Stream Setup

### Step 1: Open OBS Studio
If you don't have it: https://obsproject.com/download

### Step 2: Add Video Sources

#### Option A: Streaming a Game/Match
1. Click **+ (plus)** in the **Sources** panel (bottom left)
2. Select one of these:

**🎮 Game Capture** (Best for full-screen games)
- Choose "Capture specific window"
- Select your game from dropdown
- Click OK

**🖥️ Display Capture** (Captures entire screen)
- Select your monitor
- Click OK
- Use this if Game Capture doesn't work

**📺 Window Capture** (Captures specific app window)
- Select the game/app window
- Better performance than Display Capture

#### Option B: Streaming with Webcam
1. Click **+** → **Video Capture Device**
2. Device: Select your webcam/camera
3. Click OK
4. Resize/move the camera preview as needed

---

## 🎨 Professional Tournament Layout

Here's how to create a pro-looking tournament stream:

### Layer Order (bottom to top):
```
1. Background (Image/Color)
   └─ Tournament logo or solid color

2. Game Capture/Screen
   └─ The main gameplay

3. Player Webcams (Optional)
   └─ Small corner boxes showing players

4. Overlays/Graphics
   └─ Score bars, player names, timer

5. Text/Labels
   └─ Match info, round, etc.
```

### Adding Each Layer:

**1. Background:**
```
+ → Image → Select tournament logo/backdrop
Resize to fill screen
```

**2. Game/Match:**
```
+ → Game Capture or Display Capture
Position in center
```

**3. Player Cams (if available):**
```
+ → Video Capture Device → Select camera
Right-click → Transform → Edit Transform
Resize to small box (e.g., 320x180)
Move to corner
```

**4. Overlays:**
```
+ → Browser Source (for web-based overlays)
OR
+ → Image (for static graphics)
```

**5. Text:**
```
+ → Text (GDI+)
Type: "Player 1 vs Player 2"
Choose font, color, size
Position where needed
```

---

## 🎤 Audio Setup

### Add Audio Sources:

**Desktop Audio** (Game sound, music):
- Usually auto-detected
- Check **Audio Mixer** panel - should show "Desktop Audio"

**Microphone** (Your commentary):
- Should auto-detect your mic
- Check **Audio Mixer** - should show "Mic/Aux"

**Adjust Levels:**
- Game audio: around -20dB to -15dB
- Microphone: around -12dB to -6dB
- Watch the meters - keep out of red!

---

## 🎯 Common Tournament Scenarios

### Scenario 1: Local Tournament (In-Person)
**What you need:**
- Gaming PC/Console
- OBS on streaming PC (can be same PC)
- Optional: Player webcams
- Optional: Commentator mics

**OBS Sources:**
1. Game Capture → The match
2. Video Capture Device → Player cams (if available)
3. Audio Input → Commentator mics
4. Text → Player names, scores

### Scenario 2: Online Tournament (Remote Players)
**What you need:**
- Screen capture of match
- Discord/call for audio
- Optional: Overlays with player info

**OBS Sources:**
1. Window Capture → Game window
2. Audio Output Capture → Desktop audio (captures Discord)
3. Browser Source → Tournament bracket/overlay

### Scenario 3: Simple Camera Stream
**What you need:**
- Just a webcam/camera

**OBS Sources:**
1. Video Capture Device → Your camera
2. Optional: Text overlays

---

## 🔧 OBS Settings for Best Quality

### Go to: Settings → Video
```
Base Resolution: 1920x1080
Output Resolution: 1920x1080 (or 1280x720 for slower internet)
FPS: 30 (tournaments) or 60 (fast games)
```

### Go to: Settings → Output
```
Output Mode: Simple
Video Bitrate: 6000 Kbps (for 1080p) or 3000 Kbps (for 720p)
Encoder: x264 (software) or NVENC (if you have Nvidia GPU)
Audio Bitrate: 160
```

### Go to: Settings → Stream
```
Service: Custom
Server: rtmps://global-live.mux.com:443/app
Stream Key: [Your key from backend]
```

---

## ✅ Testing Your Setup

Before going live:

1. **Test Sources:**
   - Can you see your game/camera in OBS preview?
   - Are overlays positioned correctly?

2. **Test Audio:**
   - Check Audio Mixer meters
   - Speak into mic - see levels moving?
   - Play game - hear sound?

3. **Test Stream:**
   - Click **Start Streaming**
   - Wait 10-15 seconds
   - Open your watch page in browser
   - Check if everything looks/sounds good

4. **Check Performance:**
   - Watch OBS bottom bar
   - CPU usage should be <80%
   - Should show "Green" connection
   - No dropped frames

---

## 🎮 Example Setups by Game Type

### Fighting Games (Street Fighter, Tekken, etc.)
```
Sources:
1. Game Capture (the match)
2. Two webcams (both players' faces)
3. Text overlay (player names, round number)
4. Score graphic
```

### Strategy Games (Chess, Card Games)
```
Sources:
1. Window Capture (game board)
2. Webcam (commentator or players)
3. Text (player names, timer)
```

### First-Person Shooters (CS:GO, Valorant)
```
Sources:
1. Game Capture (full screen gameplay)
2. Minimal overlays (team scores)
3. Commentator audio via Desktop Audio
```

---

## 🆘 Troubleshooting

### "I can't see my game in OBS"
- Try Display Capture instead of Game Capture
- Run OBS as Administrator
- Make sure game is running
- Try Window Capture with game window selected

### "Camera/Webcam not showing"
- Check camera is not being used by another app
- Select correct device in Video Capture Device
- Try unplugging and replugging camera

### "No audio"
- Check Audio Mixer - mute icons not enabled
- Desktop Audio: make sure volume is up on PC
- Mic: check it's selected in Settings → Audio

### "Stream is laggy"
- Lower Output Resolution to 720p
- Reduce Video Bitrate to 3000 Kbps
- Close other programs
- Use Game Capture instead of Display Capture

---

## 📚 Resources

- **OBS Download:** https://obsproject.com/
- **Free Overlays:** https://streamlabs.com/library
- **OBS Tutorials:** YouTube "OBS tutorial 2024"
- **Your Backend:** http://localhost:3001/test.html

---

## 🎯 Quick Checklist

Before streaming:
- ✅ OBS sources added (game/camera)
- ✅ Audio levels good (not in red)
- ✅ Stream settings configured (server + key)
- ✅ Test stream to watch.html works
- ✅ Overlays/text positioned
- ✅ Good lighting (if using camera)
- ✅ Stable internet connection

**Then click Start Streaming!** 🚀
