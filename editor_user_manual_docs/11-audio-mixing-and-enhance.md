# Audio — Mixing, Enhancement, SFX & AI Voice

> **For humans, not agents.** This document describes how a person edits video by hand using the
> on-screen controls of the SkillTown video editor. It is **not** an AI skill or an automation API.
> If you are an AI agent, do **not** treat these steps as callable commands — for programmatic
> control use the agent skills/commands documented elsewhere (see `_Agent/AGENTS.md`).

> Mix clip audio, control final loudness, enhance speech and music, add sound effects, and generate AI voiceovers.

## Where to find it

Open the editor and use the menu panel. Choose **SFX** to open **Sound Effects**. On layouts that show the horizontal media row, **Audio** opens the **Audios** panel for built-in music.

Select an audio or video item on the canvas or timeline to open its properties panel. Audio items show **Audio** with tabs for **Basic**, **Effects**, and **Auto-Captions**. Videos with sound show audio controls in their properties panel. The bottom timeline header has the project-wide **Mute** / **Unmute** button and master volume slider, and the master output strip sits above the timeline with **Peak**, **LUFS**, and the active master preset.

## What you can do

- Adjust each clip with **Gain**, **Volume**, **Active** / **Off**, **Audio** / **Muted**, **Playback rate**, **Custom**, **Reverse**, live metering, and **Volume** keyframes for fades.
- Read the dB fader scale from **−∞** through **0** to boosted values up to **+48**, and use the dB meter channels **L**, **R**, or **M** to spot clipping.
- Use the master bus strip for **Peak**, **LUFS**, **Momentary**, **Short-term**, **Integrated**, **GR**, **Duck**, **Preset**, **Target LUFS**, and **True peak** control.
- Apply **Audio Processing** with **Equalizer**, **Compressor**, **Noise Gate**, **De-Esser**, **Auto-Duck**, and **Noise Reduction**.
- Set **Track role (auto-duck)** to **Default**, **Voice**, or **Music** so **Auto-Duck** knows what should trigger ducking and what should lower.
- Search **Sound Effects**, preview them, add them to the timeline, manage **Favourites** and **Recents**, and upload personal sounds in **My Sounds**.
- Generate narration in **AI Voice Generation** from **Enter your script**, **Select voice**, and **Generate Voice**.

## How to adjust clip volume, gain, fades, and speed

1. Select an audio clip or a video clip with sound.
2. Open **Basic** in the properties panel.
3. Drag **Gain** for dB-style mixing. The readout shows values such as **−∞ dB**, **0.0 dB**, or **+6.0 dB**. Double-click the fader to reset to **0 dB**.
4. Use **Volume** for a numeric level. In the full audio panel it runs from **0** to **25200** so audio can be boosted far above 100%; on simpler controls it may appear as a **0** to **100** percent slider.
5. Use **Active** / **Off** to include or exclude the clip from preview/export. Use **Audio** / **Muted** to silence or restore only that clip’s sound.
6. Open **Speed** and change **Playback rate**. Click **0.25x**, **0.5x**, **0.75x**, **1x**, **1.5x**, **2x**, **3x**, or **4x**, or drag **Custom** from **0.1x** to **4x**. Turn on **Reverse** to play the selected audio or video backward.
7. For audio fade-ins, fade-outs, and manual ducking, open **Keyframes** and animate **Volume**. Place one low-volume keyframe at the start or end and one normal-volume keyframe after or before it.
8. If you are using an effect card that exposes **Fade In** and **Fade Out**, those values are measured in frames and fade the effect’s intensity. For audio-only loudness fades, use **Keyframes** → **Volume**.
9. Optional: right-click a clip and use **Mute clip**, **Unmute clip**, **Volume**, or **Track Role** for quick changes.

| Control | What it does |
|---|---|
| **Gain** | Main dB fader for clip gain. The fader is logarithmic, has a **0** unity mark, and can boost into the yellow/red zone. |
| **Volume** | Numeric clip volume. Use it for exact values, quick percentage changes, or boosting audio items; the full audio panel range is **0** to **25200**. |
| **Active** / **Off** | Keeps the clip in the project but turns it on or excludes it from preview/export. |
| **Audio** / **Muted** | Mutes or restores only the selected clip’s audio. |
| **Playback rate** | Changes clip speed. The current value appears as a value such as **1x** or **1.5x**. |
| **Custom** | Fine speed control from **0.1x** to **4x** in small steps. |
| **Reverse** | **Play the selected clip backward.** |
| **Keyframes** → **Volume** | Creates precise fades, ramps, and manual ducking moves over time. |
| **Track role (auto-duck)** | Sets the parent track to **Default**, **Voice**, or **Music**. |

## How to read the dB fader and dB meter

1. Use **Gain** first when balancing clips. It shows the clip level in dB instead of only percent.
2. Treat **0** as unity: the clip plays at its original level. Values below **0** reduce level; values above **0** boost level.
3. Watch the fader colors. Green means quieter/safe, yellow approaches loud, and red means boosted headroom where clipping is more likely.
4. If analysis is available, the cyan source-peak marker shows the clip’s measured peak on the fader. The tooltip reads **Source peak:** followed by the dB value.
5. Turn on **Live meter** to see real-time **L** and **R** levels for stereo or **M** for mono. The numeric readout shows **—** when there is no current signal.
6. Read the meter scale as dBFS: **−∞**, **-40**, **-20**, **-12**, **-6**, and **0**. Red near **0** means the signal is at or above full scale.

| Meter label | What it means |
|---|---|
| **Live meter** | Per-clip real-time meter. When paused it can show **(paused)**; when outside the clip it can show **(playhead outside clip)**. |
| **L** / **R** | Left and right stereo channels. If one side is much louder, the clip may be unbalanced. |
| **M** | Mono channel. |
| **—** | No usable signal at the current playhead position. |
| **Live meter unavailable.** | The editor could not read waveform data for live metering. |
| **Off — turn on to see real-time L/R levels during playback.** | The live meter is disabled to save CPU. |
| **Loudness** | Static source analysis for **Peak** and **RMS**. It can show **analyzing…** while loading. |
| **Peak** / **source** | Highest source level before your current gain. |
| **RMS** / **source** | Average source energy before your current gain. |
| **Peak** / **after gain** | Estimated peak after the current **Gain** / **Volume** setting. |
| **RMS** / **after gain** | Estimated average level after the current **Gain** / **Volume** setting. |
| **Couldn’t analyze (silent track or unsupported codec).** | Static loudness analysis is not available for that clip. |

## How to use the master bus and loudness meter

1. Play the timeline so the master output strip has signal.
2. Watch the compact strip. **Peak** shows peak level in dB, **LUFS** shows momentary loudness, and the preset pill shows the active target, for example **📻 Instagram**.
3. Click the strip to expand it. You can also click **Master bus: 📻 Instagram** in a clip’s audio panel to open the master controls.
4. Read the expanded meters:

| Meter | What it tells you |
|---|---|
| **Peak** | Current master peak. Red/orange segments mean you are close to clipping. |
| **LUFS** | Compact momentary loudness readout on the collapsed strip. |
| **Momentary** | 400 ms loudness window for what is happening right now. |
| **Short-term** | 3 second loudness window for smoother loudness decisions. |
| **Integrated** | Overall mix loudness. It can show a spinner and **…** while the pre-scan runs. |
| **GR** | Gain reduction from the master limiter. Bigger numbers mean the limiter is working harder. |
| **Duck** | Auto-duck reduction. It shows **Off** when disabled, **Idle** when waiting for speech, or a dB reduction during ducking. |

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

6. If you choose **Custom**, edit the custom master controls:

| Control | Range | Unit | What it changes |
|---|---:|---:|---|
| **Threshold** | **-24** to **0** | **dBFS** | Limiter threshold where peak control begins. |
| **Ratio** | **1** to **30** | **:1** | Limiter strength above the threshold. |
| **Attack** | **0.1** to **20** | **ms** | How quickly the limiter reacts. |
| **Release** | **10** to **500** | **ms** | How quickly the limiter relaxes. |
| **Target LUFS** | **-30** to **-8** | **LUFS** | Final integrated loudness target. |
| **True peak** | **-6** to **0** | **dBTP** | Maximum allowed true-peak ceiling. |
| **LRA** | **1** to **20** | **LU** | Loudness range target. |

7. Use **Reset** to return from **Custom** to the default master preset.
8. In the timeline header, use **Mute** or **Unmute** for the whole project. Drag the adjacent slider from **0%** to **100%**; moving it above 0 while muted restores audio.

## How to apply Equalizer

1. Select a clip with audio.
2. Open **Audio Processing**.
3. Turn on **Equalizer**.
4. Choose **Preset** or adjust the band sliders.
5. Use **Reset EQ to flat** to return the bands to zero.

| Control | Range or choices | What it does |
|---|---|---|
| **Equalizer** | On/off | Enables or bypasses EQ for this clip. |
| **Preset** | **Flat**, **Voice Enhance**, **Bass Boost**, **Podcast**, **Warm**, **Bright**, **De-mud**, **Telephone**, **Custom** | Starts from a named tonal curve. |
| **Low** | **200 Hz**, **-12.0 dB** to **+12.0 dB** | Low-shelf band for bass, rumble, and warmth. |
| **Mid** | **1 kHz**, **-12.0 dB** to **+12.0 dB** | Peaking band for body and speech clarity. |
| **High** | **4 kHz**, **-12.0 dB** to **+12.0 dB** | High-shelf band for brightness and edge. |

| Preset | Description shown in the editor |
|---|---|
| **Flat** | **No change — bypass EQ** |
| **Voice Enhance** | **Clearer speech with presence** |
| **Bass Boost** | **Deeper, fuller bass** |
| **Podcast** | **Crisp voice, reduced rumble** |
| **Warm** | **Smooth and less harsh** |
| **Bright** | **Airy and present** |
| **De-mud** | **Remove boxy, muddy sound** |
| **Telephone** | **Simulated phone call effect** |

The panel notes **EQ preview is live • also applied during export**.

## How to apply Compressor

1. In **Audio Processing**, turn on **Compressor**.
2. Choose a preset first.
3. Open **Advanced** for detailed controls.

| Control | Range or choices | What it does |
|---|---|---|
| **Compressor** | On/off | Enables or bypasses compression for this clip. |
| Preset picker | **Off**, **Gentle Voice**, **Podcast**, **Aggressive Voice**, **Broadcast**, **Limiter**, **Custom** | Sets compression for common voice, broadcast, and peak-control needs. |
| **Advanced** | Collapsed/expanded | Shows detailed compressor controls. |
| **Threshold** | **-60** to **0** | Level where compression starts. |
| **Ratio** | **1** to **20** | Compression strength. **1** is little/no compression; high values approach limiting. |
| **Attack (ms)** | **0.1** to **100** | How quickly compression reacts after audio crosses the threshold. |
| **Release (ms)** | **10** to **1000** | How quickly compression stops after the signal drops. |
| **Knee (dB)** | **1** to **8** | How smoothly compression begins around the threshold. |
| **Makeup (dB)** | **0** to **24** | Adds gain after compression. |

| Preset | Description shown in the editor |
|---|---|
| **Off** | **No compression** |
| **Gentle Voice** | **Light vocal leveling — natural dynamics preserved** |
| **Podcast** | **Even vocal levels for spoken content** |
| **Aggressive Voice** | **Heavy compression — loud, in-your-face vocals** |
| **Broadcast** | **Broadcast-standard compression for consistent levels** |
| **Limiter** | **Brickwall peak control — no signal above threshold** |

The panel notes **Live preview • applied during export**.

## How to apply Noise Gate

1. In **Audio Processing**, turn on **Noise Gate**.
2. Choose a preset such as **Gentle**, **Studio**, **Aggressive**, or **Breath Remove**.
3. Open **Advanced** to tune how quiet gaps are reduced.

| Control | Range or choices | What it does |
|---|---|---|
| **Noise Gate** | On/off | Enables or bypasses gating for this clip. |
| Preset picker | **Off**, **Gentle**, **Studio**, **Aggressive**, **Breath Remove**, **Custom** | Controls how strongly quiet gaps are reduced. |
| **Advanced** | Collapsed/expanded | Shows detailed gate controls. |
| **Threshold (dB)** | **-60** to **-10** | Level below which the gate reduces sound. |
| **Range (dB)** | **-80** to **0** | How much quieter gated sections become. |
| **Attack (ms)** | **0.1** to **50** | How quickly the gate opens for speech or sound. |
| **Release (ms)** | **10** to **500** | How naturally the gate closes after sound ends. |

| Preset | Description shown in the editor |
|---|---|
| **Off** | **No gating** |
| **Gentle** | **Light background reduction between words** |
| **Studio** | **Clean silence between phrases — ideal for SM7B** |
| **Aggressive** | **Deep cuts — removes all noise between words** |
| **Breath Remove** | **Targets breath noise without cutting speech tails** |

The panel notes **Live preview • applied during export**.

## How to apply De-Esser

1. In **Audio Processing**, turn on **De-Esser**.
2. Choose a preset that matches the voice or the amount of sibilance.
3. Open **Advanced** to tune the target frequency range.

| Control | Range or choices | What it does |
|---|---|---|
| **De-Esser** | On/off | Enables or bypasses sibilance reduction. |
| Preset picker | **Off**, **Gentle**, **Standard**, **Aggressive**, **Female Voice**, **Male Voice**, **Custom** | Reduces harsh “s”, “sh”, and bright consonant sounds. |
| **Advanced** | Collapsed/expanded | Shows detailed de-esser controls. |
| **Frequency (Hz)** | **3000** to **10000** | Center frequency for sibilance detection. |
| **Bandwidth (Hz)** | **1000** to **8000** | Width of the frequency area being controlled. |
| **Threshold (dB)** | **-40** to **0** | Level where de-essing starts. |
| **Ratio** | **1** to **20** | How strongly sibilance is reduced. |

| Preset | Description shown in the editor |
|---|---|
| **Off** | **No de-essing** |
| **Gentle** | **Light sibilance taming — natural sound** |
| **Standard** | **Balanced de-essing for most voices** |
| **Aggressive** | **Heavy sibilance removal — careful of lisping** |
| **Female Voice** | **Higher frequency target for female sibilance** |
| **Male Voice** | **Lower frequency target for male sibilance** |

The panel notes **Live preview • applied during export**.

## How to use Auto-Duck

1. Put narration, dialogue, or speech on a track set to **Voice**.
2. Put background music on a track set to **Music**.
3. Select the music clip you want to lower during speech.
4. In **Audio Processing**, turn on **Auto-Duck**.
5. Choose a preset, play the timeline, and watch **Duck** in the master strip.
6. Open **Advanced** if you need to change ducking amount, speech detection, or fade timing.

| Control | Range or choices | What it does |
|---|---|---|
| **Auto-Duck** | On/off | Enables or bypasses automatic music ducking. |
| Preset picker | **Off**, **Subtle**, **Standard**, **Aggressive**, **Podcast**, **Custom** | Sets duck amount, speech threshold, and fade timing. |
| **Advanced** | Collapsed/expanded | Shows detailed ducking controls. |
| **Duck (dB)** | **-30** to **0** | How far the music lowers during detected speech. |
| **Speech Thresh (dB)** | **-60** to **-10** | How loud voice must be to trigger ducking. |
| **Fade In (ms)** | **10** to **1000** | How quickly music ducks when speech starts. |
| **Fade Out (ms)** | **10** to **1000** | How quickly music returns after speech ends. |
| **Track role (auto-duck)** | **Default**, **Voice**, **Music** | Tells the editor which tracks are speech triggers and which tracks should duck. |

| Preset | Description shown in the editor |
|---|---|
| **Off** | **No auto-ducking** |
| **Subtle** | **Light ducking — music stays present** |
| **Standard** | **Balanced — vocals clearly above music** |
| **Aggressive** | **Music nearly silent during speech** |
| **Podcast** | **Smooth transitions — long fades, moderate reduction** |

The panel notes **Preview is live · also applied during export** and **Set track roles (🎤 Voice / 🎵 Music) via right-click or panel below**.

## How to apply Noise Reduction

1. Select a clip with steady background noise, such as fan hum or room tone.
2. Open **Audio Processing** and find **Noise Reduction**.
3. In a browser, the card may show **Desktop App Only**, the explanation **Spectral subtraction noise reduction requires the ContentLead desktop app for local FFT processing.**, and **Get Desktop App**. Use the desktop app for this feature.
4. In the desktop app, turn on **Noise Reduction**.
5. Adjust **Reduction Amount**, or click **Light**, **Medium**, or **Heavy**.
6. Use the noise reference line. It shows **Noise sample: 0.0s – 1.0s** for the selected segment or **Active reference:** when using a saved reference.
7. In **Noise Profiles**, choose an existing saved profile or click **Save New** when a quiet segment is available.
8. To save a profile, enter **Profile name (e.g., Office Fan)**, click **Save Profile**, or wait if the button says **Saving...**. You can also **Cancel**.
9. Click **Process Audio**. While processing, the button and status show **Processing...**.
10. When processing finishes, the status shows **Ready**. Use **Reset** to return to the original source. If it fails, the status shows **Failed** with an error message.

| Control | Range or choices | What it does |
|---|---|---|
| **Noise Reduction** | On/off | Enables or bypasses the processed audio. |
| Status badge | **Not processed**, **Processing...**, **Ready**, **Failed** | Shows whether cleaned audio is available. |
| **Reduction Amount** | **0%** to **100%**, step **5%** | Spectral noise reduction strength. |
| Amount presets | **Light**, **Medium**, **Heavy** | Quick strength choices: light, medium, or heavy cleanup. |
| Noise sample readout | **Noise sample: 0.0s – 1.0s** or **Active reference:** | Shows the reference noise currently used. |
| **Noise Profiles** | Saved profile list | Reuses a noise reference across clips. |
| **Using saved reference:** | Saved profile banner | Confirms which saved noise reference is active. |
| **Save New** | Button | Opens the save form for the selected quiet segment. |
| **Profile name (e.g., Office Fan)** | Text field | Names the reusable noise profile. |
| **Save the selected noise segment as a reusable profile** | Helper text | Explains what the profile will store. |
| **Save Profile** / **Saving...** | Button states | Saves the current noise segment. |
| **Listen to noise sample** / **Stop** | Profile preview button title | Previews or stops a saved profile sample. |
| **Rename** | Button title | Renames a saved profile. |
| **Delete** | Button title | Deletes a saved profile. |
| **Process Audio** / **Processing...** | Button states | Creates the cleaned audio file. |
| **Reset** | Button | Restores the original audio. |
| **No saved profiles yet** | Empty state | No reusable references have been saved. |
| **Select a quiet segment and save it as a profile** | Empty-state helper | Tells you how to create the first profile. |

## How to add sound effects

1. Open **SFX** in the menu panel. The panel heading is **Sound Effects**.
2. Use **Library** for built-in SFX, or **My Sounds** for your uploaded effects.
3. In **Library**, search with **Search...** and filter by **All**, **UI**, **Impacts**, **Transitions**, **Notifications**, **Music**, or **Foley**.
4. Browse **Recents** for recently used effects and **Favourites** for saved favorites.
5. Click the play button on a sound to preview it. While previewing, use the seek bar and speed buttons such as **1x**, **1.5x**, and **2x** if shown.
6. Click a sound or its plus button to add it at the playhead, or drag the sound onto the timeline. A success message says **Added "..." to timeline**.
7. Use the heart button to add or remove favorites. The editor confirms **Added to favourites** or **Removed from favourites**.
8. If nothing matches, the panel says **No sound effects found**.

## How to upload and organize your own SFX

1. Open **SFX**, then **My Sounds**.
2. Filter uploaded sounds by **All**, **Whoosh**, **Impact**, **Riser**, **Transition**, **UI**, **Ambient**, **Music**, **Voice**, **Notification**, **Boom**, or **Other**.
3. Use **Folders** to switch between **All**, **Unfiled**, and custom folders.
4. Click the folder-plus button to create a folder. Enter **Folder name...**, then click **Create**. Use **Cancel** to stop creating it.
5. Folder controls include **Rename folder**, **Delete folder**, and **Create folder**.
6. Drag files onto **Drag & drop sounds here**, or click **Choose Files**. The helper says **Upload multiple audio files sequentially**.
7. Upload status can show **Uploading...**, **Processing...**, **Complete!**, or **Upload failed**. Accepted files are **MP3, WAV, OGG, AAC, FLAC, WEBM • Max 10MB each**.
8. Right-click a sound for **Rename**, **Move to Folder**, **Add/Edit Tags**, **Add to Timeline**, **Favourite**, **Unfavourite**, or **Delete**.
9. Empty states include **No sounds yet**, **No sounds match this filter**, and **No sounds in this folder**.

## How to add music from Audios

1. Open **Audio** when the horizontal media row is available.
2. The panel heading is **Audios**.
3. Click a track or drag it to the timeline. Built-in items include **Open AI**, **Dawn of change**, **Hope**, **Tenderness**, and **Piano moment**.
4. Select the added music clip and balance it with **Gain**, **Volume**, **Audio Processing**, and **Track role (auto-duck)**.
5. For background beds, set the music track to **Music** before using **Auto-Duck**.

For browsing uploaded music and project assets, use the media library. This section focuses on mixing and processing after audio is on the timeline.

## How to generate AI voiceovers

1. Open **AI Voice Generation** when the AI voice panel is available.
2. In **Enter your script**, type or paste text into **Type or paste your text here to generate AI voice...**.
3. Open **Select voice**.
4. Use **Language** to filter voices. Choices include **All Languages**, **English**, **Hindi**, **Spanish**, **Polish**, **French**, **German**, **Turkish**, **Hungarian**, **Italian**, **Russian**, **Croatian**, **Chinese**, **Filipino**, **Greek**, **Finnish**, **Korean**, **Norwegian**, **Tamil**, **Indonesian**, **Arabic**, **Japanese**, **Romanian**, **Portuguese**, **Czech**, **Vietnamese**, **Swedish**, **Dutch**, and **Danish**.
5. Use **Gender** to filter by **Female**, **Male**, or **Neutral**. The closed filter may show **Gender** before a choice is selected.
6. Click a voice row to choose it. Use the play button beside a voice to preview it; the selected voice button says **Change selected voice** for accessibility.
7. Click **Generate Voice**. While it runs, the button says **Generating...**.
8. When generation succeeds, the editor says **Voice generated and added to timeline** and places the generated clip on the timeline.

If no results appear in the picker, the panel says **No voices found. Try adjusting your filters.** An older voiceover panel may instead show **Generate AI voice over**, **type your script here**, **Speaker voice**, and **Generate Voice**.

## Tips & good to know

- Start with each clip’s **Gain** and **Volume**, then use a master **Preset** to hit the final platform loudness.
- Keep most dialogue peaks below the red area on the **Live meter** and use **Compressor** before boosting with **Makeup (dB)**.
- For voice clarity, try **Equalizer** → **Voice Enhance** or **Podcast**, then **Compressor** → **Gentle Voice** or **Podcast**.
- Use **Noise Gate** for quiet gaps between words; use **Noise Reduction** for steady background noise such as fans, hum, or room tone.
- Use **De-Esser** carefully. Too much reduction can make speech sound lispy.
- **Auto-Duck** depends on track roles. If music does not lower, confirm one track is **Voice** and the music track is **Music**.
- Turn on **Live meter** only when needed; its toggle tooltip says **Disable live meter (saves CPU)** when enabled.
- Keep SFX short and intentional. After adding SFX, select each one and set **Gain** or **Volume** so it supports the edit without overpowering voice.
- The timeline header **Mute** button affects the whole project without changing individual clip settings.
- **Off (no master processing)** is useful for troubleshooting but can clip because it disables master loudness and limiting.

## Related

- [Media Library](02-media-library.md)
- [Text & Captions](05-text-and-captions.md)
- [Scenes, Templates & Styles](03-scenes-templates-styles.md)
