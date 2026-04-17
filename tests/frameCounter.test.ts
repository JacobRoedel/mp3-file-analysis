import { countFrames } from '../src/frameCounter';

const FRAME_SIZE = 417;
const HEADER_BYTES = [0xff, 0xfb, 0x90, 0x00];

function makeFrameBuffer(count: number): Buffer {
  const buf = Buffer.alloc(count * FRAME_SIZE);
  for (let i = 0; i < count; i++) {
    buf.set(HEADER_BYTES, i * FRAME_SIZE);
  }
  return buf;
}

describe('countFrames', () => {
  it('returns 0 for an empty buffer', () => {
    expect(countFrames(Buffer.alloc(0))).toEqual(0);
  });

  it('returns 0 for a buffer smaller than 4 bytes', () => {
    expect(countFrames(Buffer.from([0xff, 0xfb, 0x90]))).toEqual(0);
  });

  it('returns 0 for a buffer with no valid frames', () => {
    expect(countFrames(Buffer.alloc(100, 0x00))).toEqual(0);
  });

  it('returns 1 for a single valid frame', () => {
    expect(countFrames(makeFrameBuffer(1))).toEqual(1);
  });

  it('returns 2 for two consecutive valid frames', () => {
    expect(countFrames(makeFrameBuffer(2))).toEqual(2);
  });

  it('returns 10 for ten consecutive valid frames', () => {
    expect(countFrames(makeFrameBuffer(10))).toEqual(10);
  });

  it('ignores invalid bytes before the first valid frame', () => {
    const buf = Buffer.alloc(10 + FRAME_SIZE);
    buf.set(HEADER_BYTES, 10);
    expect(countFrames(buf)).toEqual(1);
  });

  it('ignores invalid bytes between valid frames', () => {
    const buf = Buffer.alloc(FRAME_SIZE + 10 + FRAME_SIZE);
    buf.set(HEADER_BYTES, 0);
    buf.set(HEADER_BYTES, FRAME_SIZE + 10);
    expect(countFrames(buf)).toEqual(1);
  });

  it('correctly handles a buffer that ends exactly at a frame boundary', () => {
    expect(countFrames(makeFrameBuffer(5))).toEqual(5);
  });
});
