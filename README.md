# My Room

Hands-on capstone for **Her AI Studio — Week 1**. This app lets you train a camera classifier to recognize your belongings, identify them with your camera, and keep a photo journal with notes.

The big question for this lesson: **where does your data go, and where do the models actually run?**

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5174 and allow camera access when prompted.

---

## Parts of the app

The app has three tabs. Each one uses different data and different models.

### Train

**What you do:** Name classes (e.g. `Crystal collection`, `Copic marker`, `Pokémon card`), collect training samples, then train a classifier.

**How you collect samples:**
- **Capture sample** — grab a single still frame from the live webcam
- **Train from video** — record or upload a short clip, then use ffmpeg to extract frames into training samples
- **Import images** — upload JPEGs (for example, frames you extracted with the local script below)

**What runs here:**

| Piece | What it is | Where it runs |
|-------|-----------|---------------|
| **MobileNet** | Pre-trained vision model that turns each image into a numeric "fingerprint" (embedding) | Your browser (TensorFlow.js). Weights download once from the internet, then inference is local. |
| **Your classifier** | Small model you train on top of those fingerprints to tell *your* classes apart | Your browser. Trained and stored in memory for this session. |
| **ffmpeg.wasm** | Extracts still frames from a video | Your browser. The ffmpeg engine downloads once from a CDN; your video never leaves the device. |

**Where the data goes:**

| Data | Stays on device? | Notes |
|------|------------------|-------|
| Webcam feed | Yes | Stays in the browser. Never uploaded. |
| Recorded / uploaded video | Yes | Processed in memory. Never uploaded. |
| Training samples (embeddings) | Yes, but temporary | Kept in browser memory only. Refreshing the page clears them. |
| Trained classifier | Yes, but temporary | Same as above — gone after a refresh. |

There is **no server** and **no cloud training**. You are the dataset creator and the model trainer.

---

### Identify

**What you do:** Point the camera at an item and run **Identify item** (or **Live identify**). Save a check-in to your journal.

**What runs here:**

| Piece | What it is | Where it runs |
|-------|-----------|---------------|
| **MobileNet** | Converts the live camera frame to an embedding | Your browser |
| **Your classifier** | Compares the embedding to your trained classes and picks the best match | Your browser |

**Where the data goes:**

| Data | Stays on device? | Notes |
|------|------------------|-------|
| Live camera frames | Yes | Processed frame-by-frame in the browser |
| Prediction (name + confidence) | Yes | Shown on screen; optionally saved to the journal |
| Journal photo | Yes | Captured locally when you click **Save to journal** |

Photos and predictions are **not** sent to any AI service during identification.

---

### Journal

**What you do:** Browse saved entries and ask questions about your items using a local AI assistant powered by Transformers.js.

**What runs here:**

| Piece | What it is | Where it runs |
|-------|-----------|---------------|
| **SmolLM2-135M-Instruct** | Lightweight language model (135 M parameters, quantized) that answers questions about your items | Your browser (Transformers.js + ONNX Runtime Web). Downloaded once from Hugging Face, then cached locally. |

**Where the data goes:**

| Data | Stays on device? | Notes |
|------|------------------|-------|
| Journal entries (photos + notes) | Yes | Saved in `localStorage` in your browser |
| Text sent to the model | Yes | Only the **item name** and **your question text**. No photos. Inference runs entirely in the browser. |
| Model response | Yes | Generated locally; displayed in the app |

The language model runs **entirely in your browser** — no server, no API key, no network call after the initial download.

---

## Data flow at a glance

```
Camera / video / images
        │
        ▼
   Your browser  ──►  MobileNet (vision model, local)
        │                    │
        │                    ▼
        │             Training samples / predictions
        │                    │
        ▼                    ▼
   ffmpeg.wasm          Your classifier (local)
   (frame extraction)
        │
        ▼
   Journal photos  ──►  localStorage (on your device)

Item name + question  ──►  SmolLM2-135M-Instruct (browser, ONNX, text only)
```

**Key takeaway for Week 1:** Everything in this app — vision, classification, and text generation — runs locally in your browser. Your photos, videos, and questions never leave your device.

---

## What downloads from the internet (not your data)

These are **one-time downloads** of model weights. Your photos and videos are not uploaded as part of this.

| Asset | Why | When | Approx size |
|-------|-----|------|-------------|
| MobileNet weights | Pre-trained vision model | First time you open the Train or Identify tab | ~16 MB |
| ffmpeg.wasm core | Video frame extraction | First time you click **Extract frames & add samples** | ~30 MB |
| SmolLM2-135M-Instruct (q4) | In-browser language model | First time you ask a question in the Journal tab | ~270 MB |

After the first load, your browser caches all of this. Subsequent loads are instant.

---

## Workflow

1. **Train:** Add at least two classes with three or more samples each. Use the webcam, video + ffmpeg, or imported images. Click **Train model**.
2. **Identify:** Point at an item, click **Identify item**, add an optional note, then **Save to journal**.
3. **Journal:** Browse entries. Select an item and ask a question — the model loads on first use.

### Train from video (ffmpeg)

Under **Train → Train from video**:

1. Select an active class
2. **Record video** or **Upload video**
3. Set frames per second and max frames
4. Click **Extract frames & add samples**

Or extract frames on your machine with system ffmpeg:

```bash
npm run extract-frames -- path/to/video.mp4
```

Then import the JPEG folder with **Import images**.

---

## Check your understanding

1. When you capture a training sample, where is that image stored?
2. What is the difference between MobileNet and the classifier you train?
3. If you save a journal entry, where does the photo live?
4. What text (if any) leaves your browser when you ask the AI assistant a question?
5. What happens to your trained model if you refresh the page?
6. How is the in-browser language model (SmolLM2) different from a cloud API like ChatGPT?
