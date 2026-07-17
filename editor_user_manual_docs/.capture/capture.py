#!/usr/bin/env python3
"""
Automated screenshot capture for the SkillTown editor user manual.

Drives the running SkillTown Desktop app via its local control API, puts the
editor into a series of well-defined states, captures retina PNGs, and crops
clean, manual-ready regions.

Requirements:
  - SkillTown Desktop app running (reads ~/.skilltown-desktop/api.json)
  - Editor already mounted on a project (editorReady=true). Run with --navigate
    to open a specific content id on the local dev origin first.
  - Pillow (PIL) for cropping.

Usage:
  python3 capture.py                 # capture using the currently-open project
  python3 capture.py --navigate <contentId>   # open project on local dev, then capture
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.normpath(os.path.join(HERE, "..", "images"))
API_FILE = os.path.expanduser("~/.skilltown-desktop/api.json")

# Crop box (fractions) for the right-side item Properties panel. The panel's
# left edge sits at ~0.688 of the retina window width; give a little margin.
PROP_BOX = (0.678, 0.088, 0.958, 0.985)


def load_api():
    with open(API_FILE) as f:
        d = json.load(f)
    return d["port"], d["token"]


PORT, TOKEN = load_api()
BASE = f"http://127.0.0.1:{PORT}"


def _req(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    if data:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode())


def execute(cmd, params=None):
    resp = _req("POST", "/api/execute", {"type": cmd, "params": params or {}})
    status = resp.get("status")
    if status == "failed":
        print(f"  ! {cmd} failed: {resp.get('error')}")
    return resp


def navigate(content_id):
    print(f"→ set origin local + navigate to {content_id}")
    _req("POST", "/api/app/set-origin", {"origin": "local"})
    url = f"http://localhost:3000/content/{content_id}?view=editor"
    _req("POST", "/api/navigate",
         {"url": url, "waitForReady": True, "autoRestore": True, "timeoutMs": 120000})
    wait_ready()


def wait_ready(timeout=120):
    deadline = time.time() + timeout
    while time.time() < deadline:
        h = _req("GET", "/api/health")
        if h.get("editor", {}).get("ready"):
            print("✓ editor ready")
            return True
        time.sleep(3)
    raise RuntimeError("editor not ready")


def shot(name):
    """Capture the full window and save as images/<name>.png. Returns path."""
    resp = _req("GET", "/api/screenshot")
    if "imageBase64" not in resp:
        raise RuntimeError(f"screenshot failed: {resp}")
    path = os.path.join(IMAGES_DIR, name + ".png")
    with open(path, "wb") as f:
        f.write(base64.b64decode(resp["imageBase64"]))
    return path


def crop(src_name, out_name, box_frac):
    """Crop src image by fractional box (l,t,r,b) in 0..1 -> out image."""
    from PIL import Image
    im = Image.open(os.path.join(IMAGES_DIR, src_name + ".png"))
    w, h = im.size
    l, t, r, b = box_frac
    im.crop((int(w * l), int(h * t), int(w * r), int(h * b))).save(
        os.path.join(IMAGES_DIR, out_name + ".png"))


def get_items():
    r = execute("query.getTimelineItems").get("result", {})
    return r.get("items") or r.get("timelineItems") or []


def first_of(items, *types):
    for it in items:
        if it.get("type") in types:
            return it.get("id")
    return None


def capture_temp_items(manifest):
    """Add a text, image, and audio item, capture their Design/Basic panels,
    then delete them so the project is left unchanged."""
    added = []

    def add_capture(cmd, params, itype, out, desc):
        before = {i["id"] for i in get_items()}
        r = execute(cmd, params)
        if r.get("status") != "success":
            return
        time.sleep(2.0)
        new = [i["id"] for i in get_items() if i["id"] not in before]
        if not new:
            print(f"  ! no new item for {cmd}")
            return
        nid = new[0]
        added.append(nid)
        execute("editor.deselectAll")
        execute("editor.select", {"itemIds": [nid]})
        time.sleep(1.5)
        if itype in ("text", "image"):
            execute("ui.setPropertiesTab", {"tab": "design", "type": itype})
            time.sleep(1.2)
        src = f"_tmp_{itype}"
        shot(src)
        crop(src, out, PROP_BOX)
        manifest[out] = desc
        print(f"✓ temp {itype} panel")

    add_capture("editor.addText",
                {"text": "Sample heading", "from_ms": 0, "duration_ms": 4000, "fontSize": 80},
                "text", "explore-text-design", "Text Settings — Design tab")
    add_capture("editor.addImage",
                {"url": "https://picsum.photos/id/237/1200/800", "from_ms": 0, "duration_ms": 4000},
                "image", "explore-image-design", "Image Settings — Design tab")
    add_capture("editor.addAudio",
                {"url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                 "from_ms": 0, "duration_ms": 6000},
                "audio", "explore-audio-default", "Audio Settings — Basic tab")

    if added:
        execute("editor.deselectAll")
        execute("editor.deleteItems", {"itemIds": added})
        print(f"✓ cleaned up {len(added)} temp items")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--navigate", metavar="CONTENT_ID", default=None)
    args = ap.parse_args()

    os.makedirs(IMAGES_DIR, exist_ok=True)
    if args.navigate:
        navigate(args.navigate)
    else:
        wait_ready()

    items = get_items()
    print(f"timeline items: {len(items)}")
    video_id = first_of(items, "video")
    caption_id = first_of(items, "caption")
    image_id = first_of(items, "image")
    audio_id = first_of(items, "audio")

    manifest = {}

    # --- State A: clean overview (nothing selected) ---
    execute("editor.deselectAll")
    execute("editor.seekTo", {"timeMs": 2000})
    time.sleep(1.2)
    shot("_full_overview")
    crop("_full_overview", "editor-overview", (0.0, 0.0, 1.0, 1.0))
    crop("_full_overview", "top-bar", (0.455, 0.02, 1.0, 0.082))
    crop("_full_overview", "timeline", (0.595, 0.768, 0.955, 1.0))
    crop("_full_overview", "timeline-toolbar", (0.455, 0.712, 0.955, 0.762))
    crop("_full_overview", "left-rail-tabs", (0.955, 0.085, 1.0, 0.70))
    crop("_full_overview", "canvas-preview", (0.605, 0.11, 0.81, 0.66))
    manifest["editor-overview"] = "Full editor with nothing selected"
    print("✓ overview + crops")

    # --- State B: video item selected -> Video Settings panel ---
    if video_id:
        execute("editor.select", {"itemIds": [video_id]})
        time.sleep(1.5)
        shot("_sel_video")
        crop("_sel_video", "canvas-selection-handles", (0.44, 0.06, 0.75, 0.70))
        crop("_sel_video", "properties-video", PROP_BOX)
        manifest["properties-video"] = "Video Settings properties panel"
        print("✓ video selected + panel")

        # Properties inner tabs (Design / Animate / Effects / Camera).
        for sub in ("design", "animate", "effects", "camera"):
            r = execute("ui.setPropertiesTab", {"tab": sub, "type": "video"})
            if r.get("status") != "success":
                continue
            time.sleep(1.5)
            src = f"_sel_video_{sub}"
            shot(src)
            out = f"properties-video-{sub}"
            crop(src, out, PROP_BOX)
            manifest[out] = f"Video properties — {sub.capitalize()} tab"
            print(f"✓ video properties {sub} tab")
        # Reset to Design for a clean default state.
        execute("ui.setPropertiesTab", {"tab": "design", "type": "video"})

    # --- State C: caption item selected -> Caption panel + key tabs ---
    if caption_id:
        execute("editor.deselectAll")
        execute("editor.select", {"itemIds": [caption_id]})
        time.sleep(1.5)
        shot("_sel_caption")
        crop("_sel_caption", "properties-caption", PROP_BOX)
        manifest["properties-caption"] = "Caption properties panel"
        for sub, out in (("content", "explore-caption-content"),
                         ("effects", "explore-caption-effects")):
            r = execute("ui.setPropertiesTab", {"tab": sub, "type": "caption"})
            if r.get("status") != "success":
                continue
            time.sleep(1.4)
            src = f"_cap_{sub}"
            shot(src)
            crop(src, out, PROP_BOX)
            manifest[out] = f"Caption properties — {sub.capitalize()} tab"
        execute("ui.setPropertiesTab", {"tab": "transcript", "type": "caption"})
        print("✓ caption selected + tabs")

    # --- State D: image item selected -> Image panel ---
    if image_id:
        execute("editor.deselectAll")
        execute("editor.select", {"itemIds": [image_id]})
        time.sleep(1.5)
        shot("_sel_image")
        crop("_sel_image", "properties-image", PROP_BOX)
        manifest["properties-image"] = "Image properties panel"
        print("✓ image selected + panel")

    # --- State E: multi-select (bulk) ---
    multi = [i.get("id") for i in items if i.get("type") == "caption"][:3]
    if len(multi) >= 2:
        execute("editor.deselectAll")
        execute("editor.select", {"itemIds": multi})
        time.sleep(1.5)
        shot("_sel_multi")
        crop("_sel_multi", "multi-select-timeline", (0.595, 0.768, 0.955, 1.0))
        crop("_sel_multi", "properties-multi", PROP_BOX)
        manifest["multi-select-timeline"] = "Multiple items selected on the timeline"
        print("✓ multi-select")

    execute("editor.deselectAll")

    # --- State D2: temporary text / image / audio items to document their
    # properties panels, then delete them so the project is left unchanged. ---
    capture_temp_items(manifest)

    # --- State F: left-rail menu panels (via ui.openTab) ---
    # Panels reachable only by clicking a left-rail tab. Each opens on the
    # right side (same region as the properties panel). The AI tab opens a
    # left-side panel and is skipped here.
    panel_tabs = [
        ("uploads", "panel-uploads", "Upload / Media Library panel"),
        ("styles", "panel-styles", "Styles panel"),
        ("texts", "panel-text", "Text panel"),
        ("videos", "panel-video", "Video library panel"),
        ("images", "panel-image", "Image library panel"),
        ("shapes", "panel-shapes", "Shapes panel"),
        ("transitions", "panel-effects", "Effects panel"),
        ("sfx", "panel-sfx", "SFX panel"),
        ("scenes", "panel-scenes", "Scenes panel"),
        ("brand-kit", "panel-brand", "Brand kit panel"),
    ]
    for tab, out, desc in panel_tabs:
        r = execute("ui.openTab", {"tab": tab})
        if r.get("status") != "success":
            continue
        # SFX panel streams results after mount; give it longer to settle.
        time.sleep(3.5 if tab == "sfx" else 1.8)
        src = "_panel_" + tab.replace("-", "_")
        shot(src)
        crop(src, out, PROP_BOX)
        manifest[out] = desc
        print(f"✓ {tab} panel")
    execute("ui.closePanel")

    # --- State G: AI Edit panel (opens on the LEFT side) ---
    r = execute("ui.openTab", {"tab": "ai"})
    if r.get("status") == "success":
        time.sleep(2.0)
        shot("_panel_ai")
        # AI panel docks on the left edge of the window.
        crop("_panel_ai", "panel-ai-edit", (0.0, 0.045, 0.235, 0.985))
        manifest["panel-ai-edit"] = "AI Edit panel"
        print("✓ ai-edit panel")
        execute("ui.closePanel", {"closeAI": True})

    # write manifest
    with open(os.path.join(IMAGES_DIR, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print("\nSaved images:")
    for n in sorted(os.listdir(IMAGES_DIR)):
        if n.endswith(".png") and not n.startswith("_"):
            print("  images/" + n)


if __name__ == "__main__":
    main()
