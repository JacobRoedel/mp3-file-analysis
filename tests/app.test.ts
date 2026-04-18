import request from 'supertest';
import { createApp } from '../src/app';

interface ErrorResponse {
  error: string;
}

interface FrameCountResponse {
  frameCount: number;
}

interface CorruptedResponse {
  error: string;
}

const app = createApp();

const FRAME_SIZE = 417;
const HEADER_BYTES = [0xff, 0xfb, 0x90, 0x00];

function makeTestMp3(frameCount: number): Buffer {
  const buf = Buffer.alloc(frameCount * FRAME_SIZE);
  for (let i = 0; i < frameCount; i++) {
    buf.set(HEADER_BYTES, i * FRAME_SIZE);
  }
  return buf;
}

describe('POST /file-upload', () => {
  it('returns 400 when no file is provided', async (): Promise<void> => {
    const res = await request(app).post('/file-upload');
    expect(res.status).toEqual(400);
    expect(res.body as ErrorResponse).toHaveProperty('error');
  });

  it('returns 400 when file is not an MP3', async (): Promise<void> => {
    const res = await request(app)
      .post('/file-upload')
      .attach('file', Buffer.from('hello world'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toEqual(400);
    const body = res.body as ErrorResponse;
    expect(body.error).toContain('Invalid file type');
  });

  it('returns 200 with frameCount for a valid MP3', async (): Promise<void> => {
    const buffer = makeTestMp3(5);
    const res = await request(app)
      .post('/file-upload')
      .attach('file', buffer, {
        filename: 'test.mp3',
        contentType: 'audio/mpeg',
      });
    expect(res.status).toEqual(200);
    const body = res.body as FrameCountResponse;
    expect(body.frameCount).toEqual(5);
  });

  it('returns correct frameCount for single frame MP3', async (): Promise<void> => {
    const buffer = makeTestMp3(1);
    const res = await request(app)
      .post('/file-upload')
      .attach('file', buffer, {
        filename: 'test.mp3',
        contentType: 'audio/mpeg',
      });
    expect(res.status).toEqual(200);
    const body = res.body as FrameCountResponse;
    expect(body.frameCount).toEqual(1);
  });

  it('returns 422 for empty MP3 buffer', async (): Promise<void> => {
    const res = await request(app)
      .post('/file-upload')
      .attach('file', Buffer.alloc(0), {
        filename: 'empty.mp3',
        contentType: 'audio/mpeg',
      });
    expect(res.status).toEqual(422);
    const body = res.body as CorruptedResponse;
    expect(body.error).toContain('No valid');
  });

  it('returns 422 for valid MP3 mimetype with no valid frames', async (): Promise<void> => {
    const res = await request(app)
      .post('/file-upload')
      .attach('file', Buffer.alloc(100, 0x00), {
        filename: 'noise.mp3',
        contentType: 'audio/mpeg',
      });
    expect(res.status).toEqual(422);
    const body = res.body as CorruptedResponse;
    expect(body.error).toContain('No valid');
  });

  it('response has correct Content-Type header', async (): Promise<void> => {
    const buffer = makeTestMp3(1);
    const res = await request(app)
      .post('/file-upload')
      .attach('file', buffer, {
        filename: 'test.mp3',
        contentType: 'audio/mpeg',
      });
    expect(res.status).toEqual(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns 404 for unknown routes', async (): Promise<void> => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toEqual(404);
  });
});
