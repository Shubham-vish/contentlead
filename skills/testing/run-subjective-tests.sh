#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Subjective Test Runner — Orchestrates LLM-driven visual/workflow tests
# 
# Usage: ./run-subjective-tests.sh [test-id] [--all] [--visual] [--workflow]
#
# This script executes the multi-step commands for each subjective test,
# captures results, and outputs a structured report that the AI agent
# evaluates for pass/fail using its own judgment.
#
# Requirements:
# - SkillTown Desktop running with editor ready
# - ~/.skilltown-desktop/api.json valid
# - test-assets/ populated (for asset-dependent tests)
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ──
API_JSON="$HOME/.skilltown-desktop/api.json"
ARTIFACT_DIR="$HOME/.skilltown-desktop/test-artifacts"
ASSETS_DIR="/Users/shubham/Codes/SkillTown-Desktop/test-assets"
mkdir -p "$ARTIFACT_DIR"

# ── Read connection ──
if [ ! -f "$API_JSON" ]; then
  echo "❌ ERROR: $API_JSON not found. Is SkillTown Desktop running?"
  exit 1
fi

PORT=$(python3 -c "import json; print(json.load(open('$API_JSON'))['port'])")
TOKEN=$(python3 -c "import json; print(json.load(open('$API_JSON'))['token'])")
BASE="http://127.0.0.1:$PORT"

# ── Helpers ──
exec_cmd() {
  local type="$1"
  local params="$2"
  local tab_id="${3:-}"
  local body
  if [ -n "$tab_id" ]; then
    body="{\"type\":\"$type\",\"params\":$params,\"tabId\":\"$tab_id\"}"
  else
    body="{\"type\":\"$type\",\"params\":$params}"
  fi
  curl -s -X POST "$BASE/api/execute" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body"
}

get_status() {
  echo "$1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null
}

get_result() {
  echo "$1" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',{}); print(json.dumps(r))" 2>/dev/null
}

get_item_id() {
  echo "$1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('itemId',''))" 2>/dev/null
}

get_health() {
  echo "$1" | python3 -c "import sys,json; h=json.load(sys.stdin).get('editorHealth',{}); print(f'status={h.get(\"status\",\"?\")}, errors={h.get(\"newConsoleErrors\",0)}')" 2>/dev/null
}

check_assets() {
  local missing=0
  for f in test-video-1080p.mp4 test-clip-720p.mp4 test-voice.m4a test-music.m4a test-image-1080p.png test-image-portrait.png test-speech-video.mp4; do
    if [ ! -f "$ASSETS_DIR/$f" ]; then
      echo "  ⚠️  Missing asset: $f"
      missing=1
    fi
  done
  return $missing
}

# ── Find active editor tab ──
get_editor_tab() {
  curl -s "$BASE/api/tabs" -H "Authorization: Bearer $TOKEN" | \
    python3 -c "
import sys,json
d=json.load(sys.stdin)
tabs=d.get('tabs',[])
# Find a ready editor tab
for t in tabs:
  if t.get('editorReady') or t.get('ready'):
    print(t['tabId']); exit()
# Fallback to active tab
print(d.get('activeTabId',''))
"
}

# ── Reset editor for test isolation ──
reset_editor() {
  local tab_id="$1"
  exec_cmd "editor.clearTimeline" '{}' "$tab_id" > /dev/null 2>&1
  exec_cmd "editor.resize" '{"width":1080,"height":1920}' "$tab_id" > /dev/null 2>&1
}

# ── Save screenshot ──
save_screenshot() {
  local test_id="$1"
  local response="$2"
  echo "$response" | python3 -c "
import sys,json,base64
d=json.load(sys.stdin)
r=d.get('result',{})
# Try multiple possible field names
b64=r.get('imageBase64','') or r.get('frame','') or r.get('dataUrl','') or r.get('image','')
if not b64:
  print('no_data'); sys.exit(1)
# Strip data URL prefix if present
if ',' in b64 and b64.startswith('data:'):
  b64=b64.split(',',1)[1]
with open('$ARTIFACT_DIR/${test_id}.png','wb') as f:
  f.write(base64.b64decode(b64))
print('saved')
" 2>/dev/null
  return $?
}

# ═══════════════════════════════════════════════════════════════════
#  TEST IMPLEMENTATIONS
# ═══════════════════════════════════════════════════════════════════

run_test_visual_custom_scene() {
  local tab="$1"
  echo "  Step 1: Resize to portrait..."
  exec_cmd "editor.resize" '{"width":1080,"height":1920}' "$tab" > /dev/null

  echo "  Step 2: Add custom scene with animated text..."
  local scene_code='const Scene = () => { const frame = useCurrentFrame(); const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: \"clamp\" }); const scale = spring({ frame, fps: 30, config: { damping: 200 } }); return React.createElement(AbsoluteFill, {style: {backgroundColor: \"#1a1a2e\", justifyContent: \"center\", alignItems: \"center\"}}, React.createElement(\"div\", {style: {opacity, transform: \"scale(\"+scale+\")\", color: \"#FFD700\", fontSize: 64, fontWeight: 900, textAlign: \"center\", padding: \"20px\"}}, \"Visual Test Scene\")); };'
  local r=$(exec_cmd "scene.addCustomScene" "{\"code\":\"$scene_code\",\"name\":\"visual-test\",\"from\":0,\"durationMs\":3000}" "$tab")
  echo "    → $(get_status "$r") $(get_health "$r")"

  echo "  Step 3: Seek to frame 30..."
  exec_cmd "editor.seekToFrame" '{"frame":30}' "$tab" > /dev/null
  sleep 1

  echo "  Step 4: Capture screenshot..."
  local screenshot=$(exec_cmd "query.capturePreviewFrame" '{"format":"png"}' "$tab")
  save_screenshot "visual-custom-scene" "$screenshot"

  echo "  Step 5: Verify timeline..."
  local items=$(exec_cmd "query.getTimelineItems" '{}' "$tab")
  local count=$(echo "$items" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('items',[])))" 2>/dev/null)
  echo "    → Timeline items: $count"

  local health=$(exec_cmd "query.diagnoseScenes" '{}' "$tab")
  local scene_errors=$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('count',0))" 2>/dev/null)
  echo "    → Scene errors: $scene_errors"

  echo "  RESULT: items=$count, sceneErrors=$scene_errors, screenshot=test-artifacts/visual-custom-scene.png"
}

run_test_visual_library_chart() {
  local tab="$1"
  echo "  Step 1: Resize to landscape..."
  exec_cmd "editor.resize" '{"width":1920,"height":1080}' "$tab" > /dev/null

  echo "  Step 2: Add PieChart scene..."
  local r=$(exec_cmd "scene.addLibraryScene" '{"sceneId":"PieChartScene","from":0,"durationMs":5000,"sceneProps":{"title":"Revenue by Region","segments":[{"label":"North","value":40,"color":"#FF6384"},{"label":"South","value":25,"color":"#36A2EB"},{"label":"East","value":20,"color":"#FFCE56"},{"label":"West","value":15,"color":"#4BC0C0"}]}}' "$tab")
  echo "    → $(get_status "$r") $(get_health "$r")"

  echo "  Step 3: Seek to frame 60..."
  exec_cmd "editor.seekToFrame" '{"frame":60}' "$tab" > /dev/null
  sleep 1

  echo "  Step 4: Capture screenshot..."
  local screenshot=$(exec_cmd "query.capturePreviewFrame" '{"format":"png"}' "$tab")
  save_screenshot "visual-library-chart" "$screenshot"

  local items=$(exec_cmd "query.getTimelineItems" '{}' "$tab")
  local count=$(echo "$items" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('items',[])))" 2>/dev/null)

  local health=$(exec_cmd "query.diagnoseScenes" '{}' "$tab")
  local scene_errors=$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('count',0))" 2>/dev/null)

  echo "  RESULT: items=$count, sceneErrors=$scene_errors, screenshot=test-artifacts/visual-library-chart.png"
}

run_test_visual_animation() {
  local tab="$1"
  echo "  Step 1: Add text item..."
  local r=$(exec_cmd "editor.addText" '{"text":"Animated Title","from":0,"to":4000,"details":{"fontSize":72,"color":"#FFFFFF","fontFamily":"Montserrat","fontWeight":800}}' "$tab")
  local item_id=$(get_item_id "$r")
  echo "    → itemId: $item_id"

  echo "  Step 2: Apply fadeIn animation..."
  r=$(exec_cmd "editor.setAnimation" "{\"itemId\":\"$item_id\",\"animationIn\":\"fadeIn\",\"duration\":1000}" "$tab")
  echo "    → $(get_status "$r") $(get_health "$r")"

  echo "  Step 3: Seek to midpoint (frame 15)..."
  exec_cmd "editor.seekToFrame" '{"frame":15}' "$tab" > /dev/null
  sleep 1

  echo "  Step 4: Capture screenshot..."
  local screenshot=$(exec_cmd "query.capturePreviewFrame" '{"format":"png"}' "$tab")
  save_screenshot "visual-animation" "$screenshot"

  echo "  RESULT: itemId=$item_id, screenshot=test-artifacts/visual-animation.png"
}

run_test_workflow_video_text() {
  local tab="$1"
  if [ ! -f "$ASSETS_DIR/test-video-1080p.mp4" ]; then
    echo "  ⚠️  SKIP — missing test-video-1080p.mp4"
    return
  fi

  echo "  Step 1: Add test video..."
  local r=$(exec_cmd "editor.addVideo" "{\"src\":\"$ASSETS_DIR/test-video-1080p.mp4\",\"from\":0,\"duration\":5000,\"width\":1920,\"height\":1080}" "$tab")
  echo "    → $(get_status "$r")"

  echo "  Step 2: Add title overlay..."
  r=$(exec_cmd "editor.addText" '{"text":"BREAKING NEWS","from":500,"to":3500,"details":{"fontSize":64,"color":"#FFFFFF","fontFamily":"Montserrat","fontWeight":800,"backgroundColor":"rgba(255,0,0,0.8)","borderRadius":8,"textAlign":"center"},"autoReorder":true}' "$tab")
  local text_id=$(get_item_id "$r")
  echo "    → textId: $text_id"

  echo "  Step 3: Apply fadeIn to title..."
  exec_cmd "editor.setAnimation" "{\"itemId\":\"$text_id\",\"animationIn\":\"fadeIn\",\"duration\":500}" "$tab" > /dev/null

  echo "  Step 4: Verify timeline..."
  local items=$(exec_cmd "query.getTimelineItems" '{}' "$tab")
  local count=$(echo "$items" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('items',[])))" 2>/dev/null)

  echo "  Step 5: Seek + screenshot..."
  exec_cmd "editor.seekToFrame" '{"frame":30}' "$tab" > /dev/null
  sleep 1
  local screenshot=$(exec_cmd "query.capturePreviewFrame" '{"format":"png"}' "$tab")
  save_screenshot "workflow-video-text" "$screenshot"

  echo "  RESULT: items=$count (need ≥2), screenshot=test-artifacts/workflow-video-text.png"
}

run_test_workflow_multi_scene() {
  local tab="$1"
  echo "  Step 1: Resize to landscape..."
  exec_cmd "editor.resize" '{"width":1920,"height":1080}' "$tab" > /dev/null

  echo "  Step 2: Add opener scene (0-4s)..."
  local code1='const Scene = () => { const frame = useCurrentFrame(); const scale = spring({ frame, fps: 30, config: { damping: 200 } }); return React.createElement(AbsoluteFill, {style: {backgroundColor: \"#0a192f\", justifyContent: \"center\", alignItems: \"center\"}}, React.createElement(\"div\", {style: {transform: \"scale(\"+scale+\")\", color: \"#64ffda\", fontSize: 72, fontWeight: 900}}, \"Welcome\")); };'
  exec_cmd "scene.addCustomScene" "{\"code\":\"$code1\",\"name\":\"opener\",\"from\":0,\"durationMs\":4000}" "$tab" > /dev/null

  echo "  Step 3: Add content scene (4-8s)..."
  local code2='const Scene = () => { const frame = useCurrentFrame(); const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: \"clamp\" }); return React.createElement(AbsoluteFill, {style: {backgroundColor: \"#112240\", justifyContent: \"center\", alignItems: \"center\"}}, React.createElement(\"div\", {style: {opacity, color: \"#ccd6f6\", fontSize: 48, fontWeight: 400, textAlign: \"center\", maxWidth: \"80%\"}}, \"Key Insight: AI agents can test themselves\")); };'
  exec_cmd "scene.addCustomScene" "{\"code\":\"$code2\",\"name\":\"content\",\"from\":4000,\"durationMs\":4000}" "$tab" > /dev/null

  echo "  Step 4: Add closer scene (8-12s)..."
  local code3='const Scene = () => { const frame = useCurrentFrame(); const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: \"clamp\" }); return React.createElement(AbsoluteFill, {style: {backgroundColor: \"#0a192f\", justifyContent: \"center\", alignItems: \"center\"}}, React.createElement(\"div\", {style: {opacity, color: \"#64ffda\", fontSize: 36, fontWeight: 700}}, \"Thank You\")); };'
  exec_cmd "scene.addCustomScene" "{\"code\":\"$code3\",\"name\":\"closer\",\"from\":8000,\"durationMs\":4000}" "$tab" > /dev/null

  echo "  Step 5: Verify timeline..."
  local items=$(exec_cmd "query.getTimelineItems" '{}' "$tab")
  local count=$(echo "$items" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('items',[])))" 2>/dev/null)
  local duration=$(exec_cmd "query.getDuration" '{}' "$tab" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('duration',0))" 2>/dev/null)

  local health=$(exec_cmd "query.diagnoseScenes" '{}' "$tab")
  local scene_errors=$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('count',0))" 2>/dev/null)

  echo "  RESULT: items=$count (need 3), duration=${duration}ms (need ~12000), sceneErrors=$scene_errors"
}

run_test_workflow_captions() {
  local tab="$1"
  echo "  Step 1: Add background scene..."
  local bg_code='const Scene = () => React.createElement(AbsoluteFill, {style: {backgroundColor: \"#1a1a2e\"}});'
  exec_cmd "scene.addCustomScene" "{\"code\":\"$bg_code\",\"name\":\"bg\",\"from\":0,\"durationMs\":10000}" "$tab" > /dev/null

  echo "  Step 2: Add caption 1 (0-2.5s)..."
  exec_cmd "editor.addCaption" '{"from":0,"durationMs":2500,"details":{"words":[{"word":"Hello","start":0,"end":400},{"word":"and","start":400,"end":600},{"word":"welcome","start":600,"end":1200},{"word":"to","start":1200,"end":1400},{"word":"our","start":1400,"end":1700},{"word":"show","start":1700,"end":2200}]},"autoReorder":true}' "$tab" > /dev/null

  echo "  Step 3: Add caption 2 (2.5-5s)..."
  exec_cmd "editor.addCaption" '{"from":2500,"durationMs":2500,"details":{"words":[{"word":"Today","start":0,"end":500},{"word":"we","start":500,"end":700},{"word":"discuss","start":700,"end":1200},{"word":"testing","start":1200,"end":2000}]},"autoReorder":true}' "$tab" > /dev/null

  echo "  Step 4: Style captions..."
  local r=$(exec_cmd "bulk.styleByType" '{"type":"caption","details":{"fontSize":64,"fontFamily":"Montserrat","fontWeight":800,"color":"#FFFFFF","activeColor":"#FFD700","backgroundColor":"rgba(0,0,0,0.35)","textAlign":"center","textTransform":"uppercase"}}' "$tab")
  echo "    → $(get_status "$r")"

  echo "  Step 5: Verify..."
  local items=$(exec_cmd "query.getTimelineItems" '{}' "$tab")
  local cap_count=$(echo "$items" | python3 -c "import sys,json; items=json.load(sys.stdin).get('result',{}).get('items',[]); print(sum(1 for i in items if i.get('type')=='caption'))" 2>/dev/null)

  echo "  RESULT: captions=$cap_count (need ≥2)"
}

run_test_workflow_audio_mix() {
  local tab="$1"
  if [ ! -f "$ASSETS_DIR/test-video-1080p.mp4" ] || [ ! -f "$ASSETS_DIR/test-music.m4a" ]; then
    echo "  ⚠️  SKIP — missing test assets"
    return
  fi

  echo "  Step 1: Add video..."
  exec_cmd "editor.addVideo" "{\"src\":\"$ASSETS_DIR/test-video-1080p.mp4\",\"from\":0,\"duration\":5000,\"width\":1920,\"height\":1080}" "$tab" > /dev/null

  echo "  Step 2: Add background music..."
  local r=$(exec_cmd "editor.addAudio" "{\"src\":\"$ASSETS_DIR/test-music.m4a\",\"from\":0,\"duration\":5000}" "$tab")
  local audio_id=$(get_item_id "$r")
  echo "    → audioId: $audio_id"

  echo "  Step 3: Lower music volume..."
  exec_cmd "editor.setVolume" "{\"itemId\":\"$audio_id\",\"volume\":20}" "$tab" > /dev/null

  echo "  Step 4: Apply EQ..."
  r=$(exec_cmd "audio.setEq" "{\"itemId\":\"$audio_id\",\"preset\":\"warm\"}" "$tab")
  echo "    → EQ: $(get_status "$r")"

  echo "  Step 5: Verify tracks..."
  local tracks=$(exec_cmd "query.getTrackInfo" '{}' "$tab")
  local track_count=$(echo "$tracks" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('tracks',[])))" 2>/dev/null)

  echo "  RESULT: tracks=$track_count (need ≥2)"
}

run_test_visual_bundled_noise() {
  local tab="$1"
  echo "  Step 1: Resize to landscape..."
  exec_cmd "editor.resize" '{"width":1920,"height":1080}' "$tab" > /dev/null

  echo "  Step 2: Add bundled noise scene..."
  local source="import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';\nimport { noise2D } from '@remotion/noise';\n\nexport default function Scene() {\n  const frame = useCurrentFrame();\n  const { fps } = useVideoConfig();\n  const t = frame / fps;\n  const cells = [];\n  const gridSize = 8;\n  for (let x = 0; x < gridSize; x++) {\n    for (let y = 0; y < gridSize; y++) {\n      const n = noise2D('grid', x * 0.3 + t * 0.5, y * 0.3 + t * 0.3);\n      const hue = Math.floor((n + 1) * 120 + 200);\n      const lightness = Math.floor((n + 1) * 20 + 10);\n      cells.push(\n        <div key={x+'-'+y} style={{\n          position: 'absolute',\n          left: (x / gridSize * 100)+'%',\n          top: (y / gridSize * 100)+'%',\n          width: (100 / gridSize)+'%',\n          height: (100 / gridSize)+'%',\n          backgroundColor: 'hsl('+hue+', 60%, '+lightness+'%)',\n        }} />\n      );\n    }\n  }\n  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });\n  return (\n    <AbsoluteFill>\n      {cells}\n      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity }}>\n        <div style={{ color: 'white', fontSize: 64, fontWeight: 900, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>Noise Grid</div>\n      </div>\n    </AbsoluteFill>\n  );\n}"

  local r=$(exec_cmd "scene.addBundledScene" "{\"source\":\"$source\",\"name\":\"noise-grid\",\"from\":0,\"durationMs\":5000}" "$tab")
  echo "    → $(get_status "$r") $(get_health "$r")"

  echo "  Step 3: Seek to frame 30..."
  exec_cmd "editor.seekToFrame" '{"frame":30}' "$tab" > /dev/null
  sleep 2

  echo "  Step 4: Capture screenshot..."
  local screenshot=$(exec_cmd "query.capturePreviewFrame" '{"format":"png"}' "$tab")
  save_screenshot "visual-bundled-noise" "$screenshot"

  local health=$(exec_cmd "query.diagnoseScenes" '{}' "$tab")
  local scene_errors=$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('count',0))" 2>/dev/null)

  echo "  RESULT: sceneErrors=$scene_errors, screenshot=test-artifacts/visual-bundled-noise.png"
}

run_test_workflow_vertical_reframe() {
  local tab="$1"
  if [ ! -f "$ASSETS_DIR/test-video-1080p.mp4" ]; then
    echo "  ⚠️  SKIP — missing test-video-1080p.mp4"
    return
  fi

  echo "  Step 1: Resize to 1080x1920 (portrait)..."
  exec_cmd "editor.resize" '{"width":1080,"height":1920}' "$tab" > /dev/null

  echo "  Step 2: Add landscape video..."
  local r=$(exec_cmd "editor.addVideo" "{\"src\":\"$ASSETS_DIR/test-video-1080p.mp4\",\"from\":0,\"duration\":5000,\"width\":1920,\"height\":1080}" "$tab")
  local item_id=$(get_item_id "$r")
  echo "    → videoId: $item_id"

  echo "  Step 3: Crop to 9:16 center..."
  r=$(exec_cmd "editor.cropItem" "{\"itemId\":\"$item_id\",\"crop\":{\"x\":656,\"y\":0,\"width\":607,\"height\":1080}}" "$tab")
  echo "    → crop: $(get_status "$r")"

  echo "  Step 4: Verify crop..."
  local props=$(exec_cmd "query.getItemProperties" "{\"itemId\":\"$item_id\"}" "$tab")
  local has_crop=$(echo "$props" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',{}); print('yes' if r.get('crop') or r.get('details',{}).get('crop') else 'no')" 2>/dev/null)

  echo "  Step 5: Capture screenshot..."
  exec_cmd "editor.seekToFrame" '{"frame":15}' "$tab" > /dev/null
  sleep 1
  local screenshot=$(exec_cmd "query.capturePreviewFrame" '{"format":"png"}' "$tab")
  save_screenshot "workflow-vertical-reframe" "$screenshot"

  local canvas=$(exec_cmd "query.getCanvasSize" '{}' "$tab")
  local dims=$(echo "$canvas" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',{}); print(f'{r.get(\"width\",0)}x{r.get(\"height\",0)}')" 2>/dev/null)

  echo "  RESULT: canvas=$dims, crop=$has_crop, screenshot=test-artifacts/workflow-vertical-reframe.png"
}

# ═══════════════════════════════════════════════════════════════════
#  MAIN ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════

ALL_TESTS=(
  "visual.custom-scene-renders"
  "visual.library-chart-scene"
  "visual.animation-at-midpoint"
  "workflow.assemble-video-with-text"
  "workflow.multi-scene-presentation"
  "workflow.styled-caption-sequence"
  "workflow.video-audio-mix"
  "visual.bundled-scene-with-noise"
  "workflow.vertical-reframe"
)

VISUAL_TESTS=(
  "visual.custom-scene-renders"
  "visual.library-chart-scene"
  "visual.animation-at-midpoint"
  "visual.bundled-scene-with-noise"
)

WORKFLOW_TESTS=(
  "workflow.assemble-video-with-text"
  "workflow.multi-scene-presentation"
  "workflow.styled-caption-sequence"
  "workflow.video-audio-mix"
  "workflow.vertical-reframe"
)

run_single_test() {
  local test_id="$1"
  local tab="$2"

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  TEST: $test_id"
  echo "═══════════════════════════════════════════════════════"

  # Reset editor state
  reset_editor "$tab"
  sleep 1

  case "$test_id" in
    "visual.custom-scene-renders")      run_test_visual_custom_scene "$tab" ;;
    "visual.library-chart-scene")       run_test_visual_library_chart "$tab" ;;
    "visual.animation-at-midpoint")     run_test_visual_animation "$tab" ;;
    "workflow.assemble-video-with-text") run_test_workflow_video_text "$tab" ;;
    "workflow.multi-scene-presentation") run_test_workflow_multi_scene "$tab" ;;
    "workflow.styled-caption-sequence")  run_test_workflow_captions "$tab" ;;
    "workflow.video-audio-mix")          run_test_workflow_audio_mix "$tab" ;;
    "visual.bundled-scene-with-noise")   run_test_visual_bundled_noise "$tab" ;;
    "workflow.vertical-reframe")         run_test_workflow_vertical_reframe "$tab" ;;
    *) echo "  ❌ Unknown test: $test_id"; return 1 ;;
  esac
}

# ── Parse args ──
TESTS_TO_RUN=()
if [ $# -eq 0 ] || [ "${1:-}" = "--all" ]; then
  TESTS_TO_RUN=("${ALL_TESTS[@]}")
elif [ "${1:-}" = "--visual" ]; then
  TESTS_TO_RUN=("${VISUAL_TESTS[@]}")
elif [ "${1:-}" = "--workflow" ]; then
  TESTS_TO_RUN=("${WORKFLOW_TESTS[@]}")
else
  TESTS_TO_RUN=("$1")
fi

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  ContentLead Subjective Test Runner                   ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Port: $PORT"
echo "Tests: ${#TESTS_TO_RUN[@]}"
echo "Artifacts: $ARTIFACT_DIR"

# Check assets
echo ""
echo "Checking test assets..."
check_assets && echo "  ✅ All assets present" || echo "  ⚠️  Some assets missing — asset-dependent tests will be skipped"

# Get editor tab
TAB=$(get_editor_tab)
if [ -z "$TAB" ]; then
  echo "❌ No editor tab found. Open a project in the editor first."
  exit 1
fi
echo "Tab: $TAB"

# Check editor health
HEALTH=$(curl -s "$BASE/api/health" -H "Authorization: Bearer $TOKEN")
READY=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('editor',{}).get('ready',False))" 2>/dev/null)
if [ "$READY" != "True" ]; then
  echo "❌ Editor not ready. Wait for editor to load."
  exit 1
fi
echo "Editor: ready ✅"

# Run tests
PASSED=0
FAILED=0
SKIPPED=0

for test_id in "${TESTS_TO_RUN[@]}"; do
  run_single_test "$test_id" "$TAB" 2>&1
  # The AI agent evaluates pass/fail from the output
  PASSED=$((PASSED + 1))
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  SUMMARY: ${#TESTS_TO_RUN[@]} tests executed"
echo "  Screenshots saved to: $ARTIFACT_DIR/"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "AI Agent: Review the RESULT lines and screenshots above."
echo "For each test, judge PASS/FAIL using the criteria in llm-subjective.yaml."
ls -la "$ARTIFACT_DIR"/*.png 2>/dev/null | awk '{print "  📸 " $NF}'
