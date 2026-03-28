# Free Video Generation Options Research

## Option 1: Puter.js (CLIENT-SIDE ONLY)
- **Truly free, unlimited, no API key**
- Uses "User-Pays" model - users handle their own usage costs via Puter accounts
- Client-side JavaScript only: `<script src="https://js.puter.com/v2/"></script>`
- Models: Wan-AI/Wan2.2-T2V-A14B, Wan-AI/Wan2.2-I2V-A14B
- **Problem:** Client-side only, users need Puter account, not a traditional API

## Option 2: Pollinations.ai
- Open-source platform, daily compute grants
- API: `GET https://gen.pollinations.ai/video/{prompt}?model=wan&duration=4`
- Models: veo, seedance, seedance-pro, wan, grok-video, ltx-2
- **Requires API key** (sk_ or pk_ prefix) - free registration at enter.pollinations.ai
- Daily pollen grants: 3-20 pollen/day depending on tier
- **Best option for server-side free video generation**

## Option 3: Replicate "Try for Free"
- Some models have free predictions
- Wan 2.1 video models available
- Requires account, limited free predictions
- Pay-as-you-go after free tier

## Option 4: AIML API
- Free tier: 10 requests/hour (unverified), 50K credits/day (verified)
- Has video models
- Requires registration

## RECOMMENDATION:
**Pollinations.ai** is the best choice:
1. Free registration, daily pollen grants
2. Simple REST API (GET request returns MP4)
3. Multiple video models (wan, ltx-2, seedance, veo)
4. Server-side compatible
5. Open-source project
6. We just need ONE platform API key (sk_) to use for all free-tier users
