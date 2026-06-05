---
name: ai-content-generation
description: AI-powered image generation, video analysis, text generation, and content creation using PrepWithAI MCP tools.
tags: ai, image, generate, analyze, vision, text, tts, speech, search, prepwithai, content
---

# AI Content Generation (PrepWithAI)

The AI agent has access to **PrepWithAI MCP tools** for generating and analyzing content. These tools run on a remote AI backend — NOT locally. Use them to create visuals, analyze video frames, generate text, and enhance videos.

## Available Capabilities

### 🎨 Image Generation & Analysis

| Tool | What it does |
|------|-------------|
| `prepwithai_image_generate` | Generate images from text prompts (Gemini-powered) |
| `prepwithai_image_compose` | Compose new images from reference images |
| `prepwithai_image_analyze` | Analyze/describe images using GPT-4o Vision |
| `prepwithai_image_search` | Search for stock images (Tavily-powered) |
| `prepwithai_image_generate_batch` | Generate multiple images in one call |
| `prepwithai_asset_rehost` | Upload/rehost images to permanent Azure storage |

#### Image Generation Workflow
```
1. Generate image → returns Azure blob URL (temporary SAS token)
2. Download locally → curl -o /Users/.../image.png <url>
3. Add to timeline → editor.addImage with local path
```

**Aspect ratios**: `1:1`, `16:9`, `9:16` (portrait/reel), `4:5`, `5:4`
**Styles**: `photorealistic`, `illustration`, `watercolor`, `cinematic digital art`, etc.

#### Example: Generate and add a background image
```bash
# 1. Generate (via MCP tool)
prepwithai_image_generate(
  prompt="Futuristic AI workspace with holographic screens, purple neon glow",
  aspect_ratio="9:16",
  style="cinematic digital art"
)
# → Returns azure_url

# 2. Download
curl -sL "<azure_url>" -o ~/Downloads/ai-background.png

# 3. Add to timeline
curl -X POST $API -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"editor.addImage","params":{
    "src":"/Users/.../ai-background.png",
    "name":"AI Background",
    "from":0,"duration":5000
  }}'
```

### 🎬 Video Frame Analysis

Extract frames from videos and analyze them to understand content. This enables **content-aware editing** — creating scenes, text, and transitions that match what's actually shown in the video.

#### Workflow: Analyze → Understand → Create Relevant Scenes
```bash
# 1. Extract frames from video at key timestamps
ffmpeg -ss 5 -i /path/to/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-5s.jpg -y
ffmpeg -ss 15 -i /path/to/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-15s.jpg -y
ffmpeg -ss 30 -i /path/to/video.mp4 -frames:v 1 -q:v 2 /tmp/frame-30s.jpg -y

# 2. View frames to understand content (via view tool on local files)
# OR upload to public URL and use prepwithai_image_analyze

# 3. Based on analysis, create scenes that match the video content
# Example: If video shows "AI agent demo", create intro scene about AI agents
```

#### Frame Extraction Best Practices
- Extract **3 frames per video** at 25%, 50%, 75% of duration
- Use `-q:v 2` for good quality JPEG
- Store in `/tmp/video-frames/` (temporary, cleaned up after)
- For short clips (<30s), extract at 5s, 15s, 25s
- For long clips (>60s), extract at 10s, 30s, 50s

### 🔊 Speech & Audio

| Tool | What it does |
|------|-------------|
| `prepwithai_speech_generate` | Text-to-speech (Minimax TTS) |
| `prepwithai_speech_list_voices` | List available TTS voices |
| `prepwithai_speech_clone_voice` | Clone a voice from audio sample |
| `prepwithai_sfx_search` | Search sound effects library |
| `prepwithai_sfx_categories` | List SFX categories |

#### Example: Generate voiceover
```bash
# Generate speech
prepwithai_speech_generate(
  text="Welcome to the AI Video Revolution",
  voice_id="male-qn-qingse",
  speed=1.0,
  audio_format="mp3"
)
# → Returns audio_url

# Download and add to timeline
curl -sL "<audio_url>" -o ~/Downloads/voiceover.mp3
curl -X POST $API -d '{"type":"editor.addAudio","params":{
  "src":"/Users/.../voiceover.mp3","name":"Voiceover","from":0
}}'
```

### ✍️ Text Generation

| Tool | What it does |
|------|-------------|
| `prepwithai_text_generate` | General AI text generation (GPT-4o) |
| `prepwithai_text_generate_from_template` | Use predefined templates (LinkedIn, SEO, etc.) |
| `prepwithai_text_list_templates` | List available templates |

#### Use Cases for Video Editing
- Generate compelling titles and descriptions for scenes
- Create social media captions from video content
- Generate SEO metadata for published videos
- Write script/narration text for voiceover generation

### 🔍 Web Search & Research

| Tool | What it does |
|------|-------------|
| `prepwithai_web_search` (via psearch) | Search the web for reference content |
| `prepwithai_web_fetch` (via psearch) | Fetch content from URLs |
| `prepwithai_web_crawl` (via psearch) | Crawl websites for content |

### 🎬 AI Workflows

| Workflow | Description |
|----------|-------------|
| `content_creator` | Full content creation pipeline |
| `image_creator` | Multi-step image creation |
| `scene_creator` | AI-powered scene generation |
| `video_editor` | AI video editing workflow |
| `code_agent` | Code generation for custom scenes |

## Content-Aware Video Editing

The most powerful capability is combining **video analysis** with **AI generation** to create contextually relevant content:

### Pattern: Analyze → Generate → Add
1. **Extract frames** from each video clip using `ffmpeg`
2. **Analyze frames** to understand the content (what's being shown, text on screen, people, UI, etc.)
3. **Generate matching content**:
   - Create intro/outro scenes with relevant titles
   - Generate transition scenes that bridge between topics
   - Add text overlays that describe what's happening
   - Generate background images matching the video's theme
4. **Add to timeline** with proper sequencing

### Example: Full Content-Aware Workflow
```
Video 1: AI tool demo (installing CLI, generating websites)
Video 2: Financial agent demo (valuation data, workflows)
Video 3: Tech review (Gemma 4 model launch)

→ Intro: "AI Revolution 2026" (matches tech theme)
→ Transition 1→2: "From Creative AI to Enterprise AI" 
→ Transition 2→3: "Open Source is Catching Up"
→ Outro: "The Future is Agentic"
→ Generated image: Futuristic AI workspace (matches overall theme)
```

## Key Notes

- **PrepWithAI tools are remote** — they call external APIs, not local inference
- **Image generation requires Gemini API key** — check with `psearch.apikey_status`
- **Web search requires Tavily API key** — check with `psearch.apikey_status`  
- **TTS is via Minimax** — good quality, multiple voices, supports cloning
- **Always download generated assets locally** before adding to timeline (Azure URLs have SAS token expiry)
- **Frame analysis via view tool is free** — no API key needed for analyzing extracted frames locally
