# Pollinations.ai - Free Video Generation API

## Key Findings:
- **Completely free** - open-source, no signup required for basic use
- **Simple GET API** - just a URL call: `GET https://gen.pollinations.ai/video/{prompt}`
- Returns MP4 directly
- Available models: veo, seedance, seedance-pro, wan, grok-video, ltx-2
- Parameters: duration (seconds), aspectRatio (16:9 or 9:16), audio (soundtrack), image (reference frames)
- Authentication: Bearer token (from enter.pollinations.ai) - but may work without for basic use
- They have a "Pollen" credit system but also daily compute grants

## API Call Example:
```
curl "https://gen.pollinations.ai/video/sunset%20timelapse?model=wan&duration=4" \
  -H "Authorization: Bearer YOUR_API_KEY" -o video.mp4
```

## This is the BEST free option because:
1. No API key needed for basic use (daily compute grants)
2. Multiple models available including Wan and LTX-2
3. Simple REST API (just a GET request!)
4. Returns MP4 directly
5. Open source project with active community
