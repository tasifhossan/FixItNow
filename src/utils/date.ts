export const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6

/**
 * Converts a UTC Date representation to local Bangladesh (Asia/Dhaka) time.
 */
export const toDhakaTime = (date: Date | string | number): Date => {
  return new Date(new Date(date).getTime() + DHAKA_OFFSET_MS);
};
