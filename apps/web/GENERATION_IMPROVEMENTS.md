# Video Generation Quality & Realism — Full Audit & Improvement Plan

## The 2 Main Achievements to Reach

### Achievement 1: Visual Consistency Across Scenes (Character & Scene Coherence)
The #1 quality killer right now is that each scene image is generated independently with no reference to other scenes or characters. This means:
- The same character looks completely different in every scene
- Locations change appearance between shots
- Color grading, lighting style, and overall visual tone are inconsistent
- There's no "look" to the film — it feels like random stock images

**Solution:** Implement a **Visual DNA system** — a persistent style reference that carries character descriptions, visual style tokens, and reference images across ALL generation calls. Every image generation prompt should include the film's visual identity.

### Achievement 2: Richer Scene Prompts with Cinematic Intelligence
The current scene image prompts are too generic:
```
"Cinematic film still, {description}, {lighting} lighting, {cameraAngle} shot, {mood} mood, {weather} weather, {timeOfDay}, photorealistic, shot on ARRI ALEXA 65, 8K, film grain, professional color grading"
```
This produces decent but generic images. Real cinematography involves:
- Specific lens choices (wide angle vs telephoto compression)
- Color palette decisions (warm/cool, desaturated/vibrant)
- Composition rules (rule of thirds, leading lines, framing)
- Depth staging (foreground/midground/background elements)
- Character blocking and positioning
- Emotional color theory

**Solution:** Implement a **Cinematic Prompt Engine** — an AI-powered prompt enhancer that takes the basic scene data and generates rich, cinematographer-level prompts with specific technical and artistic direction.

---

## All Improvement Opportunities Found

### A. LLM Scene Breakdown (quickGenerate)
1. **Too few scene properties** — Missing: dialogue hints, character placement, color palette, lens choice, composition notes
2. **No visual style directive** — The system prompt doesn't establish a consistent visual language for the film
3. **Generic system prompt** — Doesn't leverage genre-specific cinematography knowledge
4. **No act structure** — Scenes aren't organized into acts, making pacing feel random

### B. Image Generation Prompts
1. **No character reference injection** — Character photos exist in DB but aren't passed to scene generation
2. **No style consistency tokens** — Each prompt is standalone with no visual thread
3. **Missing composition direction** — No rule-of-thirds, leading lines, depth staging
4. **Missing color theory** — No genre-appropriate color palette guidance
5. **Missing lens simulation** — "shot on ARRI ALEXA" is vague; needs specific focal length and aperture
6. **No negative prompts** — Not telling the model what to avoid

### C. Pipeline Architecture
1. **No visual style pre-generation step** — Should generate a "look book" before scenes
2. **No reference image chaining** — Later scenes should reference earlier scene images for consistency
3. **Batch size too small** — 4 at a time is conservative; could be tuned based on API limits
4. **No retry with modified prompt on failure** — If image gen fails, it just skips

### D. Director Assistant
1. **Tool calls handling fixed** — (already done in previous session)
2. **No image regeneration tool** — Director can't ask to regenerate a specific scene's image with modifications
