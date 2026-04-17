// Bitmask for the 11-bit frame sync word (all sync bits set)
export const SYNC_MASK = 0xffe0;

// Minimum number of bytes needed to read a frame header
export const MIN_HEADER_SIZE = 4;

// Maps bitrate index bits to kbps; index 0 = free bitrate, index 15 = invalid
export const BITRATE_TABLE = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, -1,
] as const;

// Maps sample rate index bits to Hz; index 3 = reserved/invalid
export const SAMPLE_RATE_TABLE = [44100, 48000, 32000, -1] as const;

// Bit pattern 11 in binary — indicates MPEG Version 1
export const MPEG_VERSION_1 = 3;

// Bit pattern 01 in binary — indicates Layer 3
export const LAYER_3 = 1;
