import { FrameHeader } from './types';
import {
  MIN_HEADER_SIZE,
  SYNC_MASK,
  MPEG_VERSION_1,
  LAYER_3,
  BITRATE_TABLE,
  SAMPLE_RATE_TABLE,
} from './constants';

export function parseFrameHeader(buffer: Buffer, offset: number): FrameHeader | null {
  // Ensure there are enough bytes remaining to read a full header
  if (buffer.length - offset < MIN_HEADER_SIZE) return null;

  // Verify the 11-bit frame sync word is present in the first two bytes
  const twoBytes = (buffer[offset] << 8) | buffer[offset + 1];
  if ((twoBytes & SYNC_MASK) !== SYNC_MASK) return null;

  // Extract and validate the MPEG version from bits 4-3 of byte 2
  const version = (buffer[offset + 1] >> 3) & 0x03;
  if (version !== MPEG_VERSION_1) return null;

  // Extract and validate the layer from bits 2-1 of byte 2
  const layer = (buffer[offset + 1] >> 1) & 0x03;
  if (layer !== LAYER_3) return null;

  // Extract the bitrate index from the upper 4 bits of byte 3 and look up kbps value
  const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0f;
  const bitrate = BITRATE_TABLE[bitrateIndex];
  if (bitrate === 0 || bitrate === -1) return null;

  // Extract the sample rate index from bits 3-2 of byte 3 and look up Hz value
  const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
  const sampleRate = SAMPLE_RATE_TABLE[sampleRateIndex];
  if (sampleRate === -1) return null;

  // Extract the padding bit from bit 1 of byte 3
  const padding = ((buffer[offset + 2] >> 1) & 0x01) === 1;

  return { version, layer, bitrate, sampleRate, padding };
}
