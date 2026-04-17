export interface FrameHeader {
  version: number;
  layer: number;
  bitrate: number;
  sampleRate: number;
  padding: boolean;
}

export interface FrameCountResult {
  frameCount: number;
}

export class InvalidFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFileError';
  }
}

export class CorruptedFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorruptedFileError';
  }
}

export class UnsupportedFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFormatError';
  }
}
