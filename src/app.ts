import express, { Application, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { countFrames } from './frameCounter';
import { InvalidFileError } from './types';

export function createApp(): Application {
  const app = express();

  // Configure multer to store uploaded files in memory as Buffer objects
  const upload = multer({ storage: multer.memoryStorage() });

  // POST /file-upload — accepts an MP3 file and returns its frame count
  app.post('/file-upload', upload.single('file'), (req: Request, res: Response): void => {
    if (req.file === undefined) {
      throw new InvalidFileError('No file provided');
    }

    if (req.file.mimetype !== 'audio/mpeg') {
      throw new InvalidFileError('Invalid file type. Please upload an MP3 file.');
    }

    const frameCount = countFrames(req.file.buffer);
    res.json({ frameCount });
  });

  // 404 handler
  app.use((_req: Request, res: Response): void => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error(err);

    if (err instanceof InvalidFileError) {
      res.status(400).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
