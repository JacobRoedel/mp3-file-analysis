import { FrameHeader } from './types';
import { MIN_HEADER_SIZE } from './constants';

export function calculateFrameSize(header: FrameHeader): number {
  // Convert bitrate from kbps to bits per second
  const bitrateInBps = header.bitrate * 1000;

  // Convert padding boolean to numeric value for use in the formula
  const paddingValue = header.padding ? 1 : 0;

  // Apply the MPEG Version 1 Layer 3 frame size formula
  const frameSize = Math.floor((144 * bitrateInBps) / header.sampleRate) + paddingValue;

  // Reject frame sizes too small to contain a valid header
  if (frameSize < MIN_HEADER_SIZE) return 0;

  return frameSize;
}
