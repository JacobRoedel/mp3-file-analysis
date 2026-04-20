import { parseFrameHeader } from './frameHeader';
import { calculateFrameSize } from './frameSize';
import { MIN_HEADER_SIZE } from './constants';

// Detects Xing/Info VBR and CBR header frames inserted by LAME encoders.
// These frames use a valid MP3 frame header but carry seek table metadata
// rather than audio data and should not be counted as audio frames.
// The marker is located at the stereo side information offset: header (4 bytes)
// + side info (32 bytes) = offset + 36.
function isXingFrame(buffer: Buffer, offset: number): boolean {
  const xingOffset = offset + 36;

  if (xingOffset + 4 > buffer.length) return false;

  const marker = buffer.subarray(xingOffset, xingOffset + 4).toString('ascii');
  return marker === 'Xing' || marker === 'Info';
}

export function countFrames(buffer: Buffer): number {
  // Initialize position and frame tally
  let offset = 0;
  let frameCount = 0;

  // Continue as long as there are enough bytes left to read a header
  while (offset <= buffer.length - MIN_HEADER_SIZE) {
    // Attempt to parse a frame header at the current position
    const header = parseFrameHeader(buffer, offset);

    // No valid header here — advance one byte and retry
    if (header === null) {
      offset += 1;
      continue;
    }

    // Calculate how many bytes this frame occupies
    const frameSize = calculateFrameSize(header);

    // Frame size is unusable — advance one byte and retry
    if (frameSize === 0) {
      offset += 1;
      continue;
    }

    // Skip Xing/Info frame — contains VBR metadata not audio data
    if (isXingFrame(buffer, offset)) {
      offset += frameSize;
      continue;
    }

    // Compute where the next frame should begin
    const nextOffset = offset + frameSize;

    // Validate the candidate frame by checking for a header at the next position
    const nextHeader = parseFrameHeader(buffer, nextOffset);

    // Accept the frame if the next header is valid or we are near the end of the file
    if (nextHeader !== null || nextOffset >= buffer.length - MIN_HEADER_SIZE) {
      frameCount += 1;
      offset = nextOffset;
    } else {
      // Next position did not confirm a frame — advance one byte and retry
      offset += 1;
    }
  }

  return frameCount;
}
