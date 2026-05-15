# MP3 File Analysis API

## Overview

A REST API that accepts an MP3 file upload and returns the number of MPEG Version 1 Layer 3 frames in the file. Frames are counted by parsing the binary MP3 format directly — no MP3 parsing libraries are used. The server reads the raw file buffer, walks through it byte by byte, validates frame headers against the MPEG spec, and counts confirmed frames using lookahead verification.

## Prerequisites

- Node.js v18 or higher
- npm

## Installation

1. Clone the repository
2. `cd mp3-file-analysis`
3. `npm install`

## Running the application

### Development

```
npm run dev
```

Server starts on http://localhost:3000 by default. Set the `PORT` environment variable to use a different port.

### Production

```
npm run build
npm start
```

## Running the tests

```
npm test
```

For a coverage report:

```
npm run test:coverage
```

## Linting and formatting

```
npm run lint
npm run format
```

## API Reference

### GET /health

Returns the health status of the service.

**Success Response**
- Status: `200 OK`
- Body:
```json
{
  "status": "ok"
}
```

---

### POST /file-upload

Accepts an MP3 file upload and returns the frame count.

**Request**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` field containing an MP3 file

**Rate limits**
- 10 uploads per IP per 15 minutes on this endpoint
- 100 requests per IP per 15 minutes across all endpoints

Exceeding either limit returns a `429 Too Many Requests` response with a `Retry-After` header.

**Example using curl:**

```
curl -X POST http://localhost:3000/file-upload \
  -F "file=@/path/to/your/file.mp3;type=audio/mpeg"
```

**Success Response**
- Status: `200 OK`
- Body:
```json
{
  "frameCount": 6089
}
```

**Error Responses**
- `400 Bad Request` — no file provided or file is not an MP3
- `413 Payload Too Large` — file exceeds 50MB limit
- `422 Unprocessable Entity` — file contains no valid MPEG Version 1 Layer 3 frames
- `429 Too Many Requests` — rate limit exceeded
- `500 Internal Server Error` — unexpected error during processing

## Technical approach

### MP3 frame structure

Each MP3 frame starts with a 4-byte header. The first 11 bits are the sync word (all 1s), followed by fields encoding the MPEG version, layer, bitrate index, sample rate index, and padding bit. Validating these fields is enough to confirm a candidate byte sequence is a real frame header.

### Parsing algorithm

- Walk through the file buffer byte by byte
- At each position attempt to parse a 4-byte frame header
- Validate the sync word using bitmask `0xFFE0`
- Validate MPEG Version 1 and Layer 3 from the header bits
- Look up bitrate and sample rate from lookup tables
- Calculate frame size using: `Math.floor(144 * bitrate * 1000 / sampleRate) + padding`
- Use lookahead verification to confirm that a valid frame header exists at the predicted next position before counting the current frame
- Jump forward by frame size on confirmed frames, advance by 1 byte on failures

### Why 144 in the frame size formula

144 = 1152 samples per frame / 8 bits per byte. Every MPEG Version 1 Layer 3 frame contains exactly 1152 audio samples, so this constant is baked into the formula for all MP3 files of this type.

## Known limitations and potential improvements

- **Mimetype validation** relies on the client-provided `Content-Type` header. A more robust implementation would inspect the file magic bytes to verify the file is actually an MP3 regardless of what mimetype the client sends.
- **Free bitrate frames** (bitrate index 0) are skipped. A complete implementation would need a different parsing strategy for VBR files that use free bitrate encoding.
- **Memory usage** — the entire file is loaded into memory as a Buffer. A 50MB limit is enforced to prevent excessive memory consumption, but a streaming implementation would be more memory efficient for large files, processing them in chunks rather than loading all at once.
- **Lookahead depth** — lookahead verification checks one frame ahead. Checking two or three consecutive frames would further reduce the already-negligible risk of false positives from random byte sequences that happen to pass header validation.
- **Format support** — only MPEG Version 1 Layer 3 is supported as per the spec. MPEG Version 2 and 2.5, and Layers 1 and 2, are explicitly rejected.

## Project structure

```
src/
  index.ts        — entry point, starts the HTTP server
  app.ts          — Express app factory with routes and error handlers
  frameHeader.ts  — parses and validates 4-byte MP3 frame headers
  frameSize.ts    — calculates frame size from parsed header values
  frameCounter.ts — walks the buffer counting valid frames
  constants.ts    — lookup tables and constants for MP3 parsing
  types.ts        — TypeScript interfaces and custom error classes

tests/
  frameHeader.test.ts  — unit tests for frame header parser
  frameSize.test.ts    — unit tests for frame size calculator
  frameCounter.test.ts — unit tests for frame counter algorithm
  app.test.ts          — integration tests for the HTTP endpoint
```

## Deployment

The API is hosted on Google Cloud Run and deployed automatically via GitHub Actions.

### CI/CD pipeline

Every pull request and push to `main` triggers the workflow defined in `.github/workflows/deploy.yml`:

- **On a pull request** — a `test` job runs lint and the full test suite. The deploy job is skipped.
- **On merge to main** — the `test` job runs first. If it passes, a `deploy` job builds a Docker image, pushes it to Artifact Registry, and deploys it to Cloud Run. If tests fail, the deploy is blocked and Cloud Run continues serving the last successful version.

### Infrastructure

- **Runtime** — Google Cloud Run (scales to zero when idle)
- **Image registry** — Google Artifact Registry
- **Authentication** — Workload Identity Federation (keyless, no stored credentials)
- **Resource limits** — 256MB memory, max 3 instances

### Dockerfile

A multi-stage build is used to keep the runtime image lean:

1. **Builder stage** — installs all dependencies and compiles TypeScript to `dist/`
2. **Runner stage** — installs production dependencies only and copies the compiled output

## Repository

Full source code, commit history, and pull request history available at:
https://github.com/JacobRoedel/mp3-file-analysis
