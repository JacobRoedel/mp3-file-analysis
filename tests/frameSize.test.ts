import { calculateFrameSize } from '../src/frameSize';
import { FrameHeader } from '../src/types';

function makeHeader(bitrate: number, sampleRate: number, padding: boolean): FrameHeader {
  return { version: 3, layer: 1, bitrate, sampleRate, padding };
}

describe('calculateFrameSize', () => {
  it('returns correct frame size for 128kbps 44100Hz no padding', () => {
    expect(calculateFrameSize(makeHeader(128, 44100, false))).toEqual(417);
  });

  it('returns correct frame size for 128kbps 44100Hz with padding', () => {
    expect(calculateFrameSize(makeHeader(128, 44100, true))).toEqual(418);
  });

  it('returns correct frame size for 320kbps 44100Hz no padding', () => {
    expect(calculateFrameSize(makeHeader(320, 44100, false))).toEqual(1044);
  });

  it('returns correct frame size for 128kbps 48000Hz no padding', () => {
    expect(calculateFrameSize(makeHeader(128, 48000, false))).toEqual(384);
  });

  it('returns correct frame size for 128kbps 32000Hz no padding', () => {
    expect(calculateFrameSize(makeHeader(128, 32000, false))).toEqual(576);
  });

  it('returns 0 when calculated frame size is less than 4 bytes', () => {
    expect(calculateFrameSize(makeHeader(1, 44100, false))).toEqual(0);
  });
});
