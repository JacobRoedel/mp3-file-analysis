import { parseFrameHeader } from '../src/frameHeader';

describe('parseFrameHeader', () => {
  it('returns null when buffer has fewer than 4 bytes', () => {
    const buffer = Buffer.from([0xff, 0xfb, 0x90]);
    expect(parseFrameHeader(buffer, 0)).toBeNull();
  });

  it('returns null when sync word is invalid', () => {
    const buffer = Buffer.from([0x00, 0xfb, 0x90, 0x00]);
    expect(parseFrameHeader(buffer, 0)).toBeNull();
  });

  it('returns null when MPEG version is not Version 1', () => {
    const buffer = Buffer.from([0xff, 0xe3, 0x90, 0x00]);
    expect(parseFrameHeader(buffer, 0)).toBeNull();
  });

  it('returns null when layer is not Layer 3', () => {
    const buffer = Buffer.from([0xff, 0xfd, 0x90, 0x00]);
    expect(parseFrameHeader(buffer, 0)).toBeNull();
  });

  it('returns null when bitrate index is 0 (free bitrate)', () => {
    const buffer = Buffer.from([0xff, 0xfb, 0x00, 0x00]);
    expect(parseFrameHeader(buffer, 0)).toBeNull();
  });

  it('returns null when bitrate index is 15 (invalid)', () => {
    const buffer = Buffer.from([0xff, 0xfb, 0xf0, 0x00]);
    expect(parseFrameHeader(buffer, 0)).toBeNull();
  });

  it('returns null when sample rate index is 3 (reserved)', () => {
    const buffer = Buffer.from([0xff, 0xfb, 0x9c, 0x00]);
    expect(parseFrameHeader(buffer, 0)).toBeNull();
  });

  it('correctly parses a valid 128kbps 44100Hz frame header with no padding', () => {
    const buffer = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
    const result = parseFrameHeader(buffer, 0);
    expect(result).not.toBeNull();
    expect(result!.bitrate).toEqual(128);
    expect(result!.sampleRate).toEqual(44100);
    expect(result!.padding).toEqual(false);
    expect(result!.version).toEqual(3);
    expect(result!.layer).toEqual(1);
  });

  it('correctly parses a valid frame header with padding', () => {
    const buffer = Buffer.from([0xff, 0xfb, 0x92, 0x00]);
    const result = parseFrameHeader(buffer, 0);
    expect(result!.padding).toEqual(true);
  });

  it('works correctly when offset is not 0', () => {
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xfb, 0x90, 0x00]);
    const result = parseFrameHeader(buffer, 4);
    expect(result).not.toBeNull();
    expect(result!.bitrate).toEqual(128);
  });
});
