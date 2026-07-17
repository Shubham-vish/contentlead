# Audio — Mixing, Enhancement, SFX & AI Voice

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Mix clip audio, control final loudness, enhance speech and music, add sound effects, and generate AI voiceovers.

## Where to find it

Open the editor and use the menu panel. Choose **SFX** to browse and add sound effects. On layouts that show the horizontal media row, **Audio** opens the **Audios** panel for built-in music tracks.

Select an audio or video item on the canvas or timeline to open audio controls in the properties panel. Audio items show **Audio** with tabs for **Basic**, **Effects**, and **Auto-Captions**. Videos with sound show an audio section inside their properties panel. The master volume control is in the timeline header next to zoom, and the master output strip appears above the timeline as a compact meter with **Peak**, **LUFS**, and the current master preset.

## What you can do

- Adjust per-clip **Gain**, **Volume**, mute, clip on/off state, playback speed, and volume keyframes.
- Use the master output strip to watch **Peak**, **LUFS**, **Momentary**, **Short-term**, **Integrated**, **GR**, and **Duck** meters.
- Pick final loudness presets such as **Instagram / TikTok / Reels**, **YouTube**, **Spotify / Apple Podcast**, **Broadcast TV (EBU R128)**, **Cinema**, **Custom**, or **Off (no master processing)**.
- Apply **Audio Processing**: **Equalizer**, **Compressor**, **Noise Gate**, **De-Esser**, **Auto-Duck**, and **Noise Reduction**.
- Mark tracks as **Default**, **Voice**, or **Music** so auto-duck can lower music while voice is present.
- Search **Sound Effects**, preview SFX, add them to the timeline, favorite them, and upload your own sounds in **My Sounds**.
- Generate a voiceover from typed text in **AI Voice Generation** when the AI voice panel is available.

## How to adjust clip volume, gain, fades, and speed

1. Select an audio clip or a video clip with sound.
2. In the properties panel, open **Basic**.
3. Drag **Gain** for dB-style mixing. The readout shows values like **−∞ dB**, **0.0 dB**, or **+6.0 dB**. Double-click the fader to return to **0 dB**.
4. Use **Volume** for a numeric level control. Values above 100% boost the clip.
5. Use **Active** / **Off** to include or exclude the clip from preview/export. Use **Audio** / **Muted** to silence or restore only the clip’s sound.
6. Open **Speed** to change **Playback rate**. Use preset buttons **0.25x**, **0.5x**, **0.75x**, **1x**, **1.5x**, **2x**, **3x**, or **4x**, or adjust **Custom**. Turn on **Reverse** to play the selected clip backward.
7. For fade-style changes, open **Effects** and use **Animations**. Choose **In** or **Out** and apply **Fade**. For precise audio fades or ducking moves, open **Keyframes** and animate **Volume**.
8. Optional: right-click a clip and use **Mute clip**, **Unmute clip**, **Volume**, or **Track Role** for quick mixing changes.

| Control | What it does |
|---|---|
| **Gain** | Main dB fader for mixing. The fader scale runs from very quiet to boosted levels and shows a source peak marker when analysis is available. |
| **Volume** | Numeric clip volume. Use it for exact values or quick percentage-style changes. |
| **Active** / **Off** | Turns the clip on or excludes it from preview/export. |
| **Audio** / **Muted** | Keeps the clip present but silences or restores its audio. |
| **Track role (auto-duck)** | Sets the parent track to **Default**, **Voice**, or **Music**. |
| **Live meter** | Shows real-time L/R levels during playback. When off, the panel says **Off — turn on to see real-time L/R levels during playback.** |
| **Loudness** | Shows **Peak** and **RMS** for the source, plus **after volume** or **after gain** when the clip is boosted or reduced. |
| **Playback rate** | Changes clip speed from **0.1x** to **4x** with presets and **Custom**. |
| **Reverse** | Plays the selected audio or video backward. |
| **Keyframes** → **Volume** | Creates frame-accurate volume changes for fades and manual ducking. |

## How to use the master bus and loudness meter

1. Play your timeline so the master output strip has audio to measure.
2. Watch the compact strip: **Peak** shows peak level in dB, **LUFS** shows momentary loudness, and the pill shows the active preset.
3. Click the strip to expand it.
4. Use the loudness meters:

| Meter | What it tells you |
|---|---|
| **Peak** | Highest current level. Red/orange segments mean you are close to clipping. |
| **Momentary** | Short loudness reading in **LUFS** for what is happening right now. |
| **Short-term** | A smoother **LUFS** reading over a longer window. |
| **Integrated** | Overall loudness for the whole mix. It may show a spinner while analyzing. |
| **GR** | Gain reduction from the master limiter. Higher values mean the limiter is working harder. |
| **Duck** | Auto-duck reduction. It shows **Off**, **Idle**, or a dB reduction when speech triggers ducking. |

5. Open **Preset** and choose a target:

| Preset | Description shown in the editor |
|---|---|
| **Instagram / TikTok / Reels** | **-14 LUFS, -0.1 dBTP — social short-form default (Option B: transparent)** |
| **YouTube** | **-14 LUFS, -0.1 dBTP — long-form video (Option B: transparent)** |
| **Spotify / Apple Podcast** | **-16 LUFS, -0.1 dBTP — podcast platforms (Option B: transparent)** |
| **Broadcast TV (EBU R128)** | **-23 LUFS, -2 dBTP — European broadcast standard** |
| **Cinema** | **-24 LUFS, -2 dBTP — theatrical** |
| **Custom** | **User-defined loudness and limiter parameters** |
| **Off (no master processing)** | **Disables master bus. Risk of clipping.** |

6. If you choose **Custom**, edit the master controls:

| Control | Unit | What it changes |
|---|---:|---|
| **Threshold** | **dBFS** | Level where the limiter begins controlling peaks. |
| **Ratio** | **:1** | How strongly peaks are reduced above the threshold. |
| **Attack** | **ms** | How quickly the limiter reacts. |
| **Release** | **ms** | How quickly it relaxes after peaks pass. |
| **Target LUFS** | **LUFS** | Final loudness target. |
| **True peak** | **dBTP** | Maximum allowed true peak level. |
| **LRA** | **LU** | Loudness range target. |

7. Use **Reset** to return custom settings to the default preset.
8. Use the timeline header volume button to **Mute** or **Unmute** the whole project. The adjacent slider controls the master level from 0% to 100%.

## How to apply Equalizer

1. Select a clip with audio.
2. Open the audio section and expand **Audio Processing**.
3. Turn on **Equalizer**.
4. Pick a **Preset** or adjust the band sliders.
5. Use **Reset EQ to flat** if you want to return bands to zero.

| Control | Range or choices | What it does |
|---|---|---|
| Toggle | On/off | Enables or bypasses **Equalizer**. |
| **Preset** | **Flat**, **Voice Enhance**, **Bass Boost**, **Podcast**, **Warm**, **Bright**, **De-mud**, **Telephone**, **Custom** | Starts from a common tonal curve. |
| **Low** | **200 Hz**, **-12.0 dB** to **+12.0 dB** | Adds or removes low-end weight and rumble. |
| **Mid** | **1 kHz**, **-12.0 dB** to **+12.0 dB** | Shapes speech/body clarity. |
| **High** | **4 kHz**, **-12.0 dB** to **+12.0 dB** | Adds or removes brightness and edge. |

The panel notes **EQ preview is live • also applied during export**.

## How to apply Compressor

1. In **Audio Processing**, turn on **Compressor**.
2. Choose a preset first.
3. Open **Advanced** only if you need more control.

| Control | Range or choices | What it does |
|---|---|---|
| Toggle | On/off | Enables or bypasses **Compressor**. |
| Preset picker | **Off**, **Gentle Voice**, **Podcast**, **Aggressive Voice**, **Broadcast**, **Limiter**, **Custom** | Sets compression for common voice and peak-control needs. |
| **Advanced** | Collapsed/expanded | Shows detailed compressor controls. |
| **Threshold** | **-60** to **0** | Level where compression starts. |
| **Ratio** | **1** to **20** | Compression strength. |
| **Attack (ms)** | **0.1** to **100** | How quickly compression reacts. |
| **Release (ms)** | **10** to **1000** | How quickly compression stops after the signal drops. |
| **Knee (dB)** | **1** to **8** | How smoothly compression begins around the threshold. |
| **Makeup (dB)** | **0** to **24** | Adds gain after compression. |

The panel notes **Live preview • applied during export**.

## How to apply Noise Gate

1. In **Audio Processing**, turn on **Noise Gate**.
2. Choose a preset such as **Gentle**, **Studio**, **Aggressive**, or **Breath Remove**.
3. Open **Advanced** to tune the gate.

| Control | Range or choices | What it does |
|---|---|---|
| Toggle | On/off | Enables or bypasses **Noise Gate**. |
| Preset picker | **Off**, **Gentle**, **Studio**, **Aggressive**, **Breath Remove**, **Custom** | Controls how strongly quiet gaps are reduced. |
| **Advanced** | Collapsed/expanded | Shows detailed gate controls. |
| **Threshold (dB)** | **-60** to **-10** | Level below which the gate reduces sound. |
| **Range (dB)** | **-80** to **0** | How much quieter gated sections become. |
| **Attack (ms)** | **0.1** to **50** | How quickly the gate opens for speech or sound. |
| **Release (ms)** | **10** to **500** | How naturally the gate closes after sound ends. |

The panel notes **Live preview • applied during export**.

## How to apply De-Esser

1. In **Audio Processing**, turn on **De-Esser**.
2. Choose a preset that matches the voice or the amount of sibilance.
3. Open **Advanced** to tune the target frequency range.

| Control | Range or choices | What it does |
|---|---|---|
| Toggle | On/off | Enables or bypasses **De-Esser**. |
| Preset picker | **Off**, **Gentle**, **Standard**, **Aggressive**, **Female Voice**, **Male Voice**, **Custom** | Reduces harsh “s” and “sh” sounds. |
| **Advanced** | Collapsed/expanded | Shows detailed de-esser controls. |
| **Frequency (Hz)** | **3000** to **10000** | Center frequency for sibilance detection. |
| **Bandwidth (Hz)** | **1000** to **8000** | Width of the frequency area being controlled. |
| **Threshold (dB)** | **-40** to **0** | Level where de-essing starts. |
| **Ratio** | **1** to **20** | How strongly sibilance is reduced. |

The panel notes **Live preview • applied during export**.

## How to use Auto-Duck

1. Set your voice/narration track to **Voice** and your music track to **Music**. You can do this from **Track role (auto-duck)** in the properties panel or from the timeline track menu using **Track role: Default**, **Track role: 🎤 Voice**, or **Track role: 🎵 Music**.
2. Select the music clip you want to duck.
3. In **Audio Processing**, turn on **Auto-Duck**.
4. Choose a preset, then play the timeline and watch **Duck** in the master strip.
5. Open **Advanced** if you need to change how quickly and how far the music lowers.

| Control | Range or choices | What it does |
|---|---|---|
| Toggle | On/off | Enables or bypasses **Auto-Duck**. |
| Preset picker | **Off**, **Subtle**, **Standard**, **Aggressive**, **Podcast**, **Custom** | Sets ducking amount, speech threshold, and fade timing. |
| **Advanced** | Collapsed/expanded | Shows detailed ducking controls. |
| **Duck (dB)** | **-30** to **0** | How much the music lowers during detected speech. |
| **Speech Thresh (dB)** | **-60** to **-10** | How loud voice must be to trigger ducking. |
| **Fade In (ms)** | **10** to **1000** | How quickly music ducks when speech starts. |
| **Fade Out (ms)** | **10** to **1000** | How quickly music returns after speech ends. |

The panel notes **Preview is live · also applied during export** and **Set track roles (🎤 Voice / 🎵 Music) via right-click or panel below**.

## How to apply Noise Reduction

1. Select a clip with a steady background noise you want to reduce.
2. Open **Audio Processing** and find **Noise Reduction**.
3. If you are in the browser, the card may show **Desktop App Only** and **Get Desktop App**. Noise reduction requires the desktop app.
4. In the desktop app, turn on **Noise Reduction**.
5. Adjust **Reduction Amount** or choose **Light**, **Medium**, or **Heavy**.
6. Choose or create a reference in **Noise Profiles**. If no profiles exist, the panel says **No saved profiles yet** and **Select a quiet segment and save it as a profile**.
7. Click **Process Audio**. While processing, the button says **Processing...** and the status badge says **Processing...**.
8. When finished, the status changes to **Ready**. Use **Reset** to return to the original audio.

| Control | Range or choices | What it does |
|---|---|---|
| Toggle | On/off | Enables or bypasses **Noise Reduction**. |
| Status badge | **Not processed**, **Processing...**, **Ready**, **Failed** | Shows whether the processed audio is available. |
| **Reduction Amount** | **0%** to **100%** | Controls spectral noise reduction strength. |
| Amount presets | **Light**, **Medium**, **Heavy** | Quick strength choices. |
| Noise sample readout | **Noise sample: 0.0s – 1.0s** or **Active reference:** | Shows the reference noise being used. |
| **Noise Profiles** | Saved reference list | Reuse a noise reference across clips. |
| **Save New** | Opens profile save form | Saves the selected noise segment as a reusable profile. |
| **Profile name (e.g., Office Fan)** | Text field | Names a new profile. |
| **Save Profile** / **Saving...** | Button states | Saves the profile. |
| **Process Audio** / **Processing...** | Button states | Creates the cleaned audio. |
| **Reset** | Button | Restores the original source. |

## How to add sound effects

1. Open **SFX** in the menu panel. The panel heading is **Sound Effects**.
2. Use **Library** for built-in SFX, or **My Sounds** for your uploaded effects.
3. In **Library**, search with **Search...** and filter by **All**, **UI**, **Impacts**, **Transitions**, **Notifications**, **Music**, or **Foley**.
4. If you have used sounds before, browse **Recents**. Favorited sounds appear under **Favourites**.
5. Click the play button on a sound to preview it. While previewing, use the seek bar and speed buttons **1x**, **1.5x**, and **2x**.
6. Click the sound name or the plus button to add it at the current playhead position, or drag the sound onto the timeline. A success message says **Added "..." to timeline**.
7. Use the heart button to add or remove favorites. The editor confirms **Added to favourites** or **Removed from favourites**.
8. If nothing matches, the panel says **No sound effects found**.

## How to upload and organize your own SFX

1. Open **SFX**, then **My Sounds**.
2. Filter your sounds by **All**, **Whoosh**, **Impact**, **Riser**, **Transition**, **UI**, **Ambient**, **Music**, **Voice**, **Notification**, **Boom**, or **Other**.
3. Use **Folders** to switch between **All**, **Unfiled**, and custom folders. Click the folder-plus button to create a folder, enter **Folder name...**, then click **Create**.
4. Drag audio files onto **Drag & drop sounds here**, or click **Choose Files**.
5. Upload status may show **Uploading...**, **Processing...**, **Complete!**, or **Upload failed**. The panel accepts **MP3, WAV, OGG, AAC, FLAC, WEBM • Max 10MB each**.
6. Right-click a sound for **Rename**, **Move to Folder**, **Add/Edit Tags**, **Add to Timeline**, **Favourite**, **Unfavourite**, or **Delete**.
7. If the list is empty, you may see **No sounds yet**, **No sounds match this filter**, or **No sounds in this folder**.

## How to add music from Audios

1. Open **Audio** when the horizontal media row is available.
2. The panel heading is **Audios**.
3. Click or drag a track into the timeline. Built-in items include **Open AI**, **Dawn of change**, **Hope**, **Tenderness**, and **Piano moment**.
4. Select the added music clip and mix it with **Gain**, **Volume**, **Audio Processing**, and **Track role (auto-duck)**.

For browsing uploaded music and project assets, use the media library. This section focuses on mixing and processing after audio is on the timeline.

## How to generate AI voiceovers

1. Open **AI Voice Generation** when the AI voice panel is available.
2. In **Enter your script**, type or paste text into **Type or paste your text here to generate AI voice...**.
3. Open **Select voice**.
4. Use **Language** to filter voices. Choices include **All Languages**, **English**, **Hindi**, **Spanish**, **Polish**, **French**, **German**, **Turkish**, **Hungarian**, **Italian**, **Russian**, **Croatian**, **Chinese**, **Filipino**, **Greek**, **Finnish**, **Korean**, **Norwegian**, **Tamil**, **Indonesian**, **Arabic**, **Japanese**, **Romanian**, **Portuguese**, **Czech**, **Vietnamese**, **Swedish**, **Dutch**, and **Danish**.
5. Use **Gender** to filter by **Female**, **Male**, or **Neutral**.
6. Click a voice row to choose it. Use the play button beside a voice to preview it.
7. Click **Generate Voice**. While it runs, the button says **Generating...**.
8. When generation succeeds, the editor says **Voice generated and added to timeline** and places the generated audio on the timeline as an AI-generated clip.

If no results appear in the picker, the panel says **No voices found. Try adjusting your filters.**

## Tips & good to know

- Start with clip **Gain** and **Volume**, then use the master preset to hit the final platform target.
- For voice clarity, try **Equalizer** → **Voice Enhance** or **Podcast**, then add **Compressor** → **Gentle Voice** or **Podcast**.
- Use **Noise Gate** for quiet gaps between words; use **Noise Reduction** for steady background noise such as fans or room tone.
- Use **De-Esser** carefully. Too much reduction can make speech sound lispy.
- **Auto-Duck** depends on track roles. If music does not lower, confirm one track is **Voice** and the music track is **Music**.
- Turn on **Live meter** only when you need real-time levels; the panel warns it uses extra CPU while enabled.
- Keep SFX short and intentional. After adding SFX, select each one and set its **Volume** or **Gain** so it supports the edit without overpowering voice.
- The master **Mute** button affects the whole project without changing individual clip settings.

## Related

- [Media Library](02-media-library.md)
- [Text & Captions](05-text-and-captions.md)
- [Scenes, Templates & Styles](03-scenes-templates-styles.md)
