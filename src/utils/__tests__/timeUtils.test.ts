import { formatRelativeTime } from '../helpers/timeUtils';

describe('Time Utils', () => {
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock current time to 2024-01-15 12:00:00
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "방금 전" for very recent time', () => {
      const timestamp = new Date('2024-01-15T11:59:30Z').getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toBe('방금 전');
    });

    it('should return minutes ago for recent time', () => {
      const timestamp = new Date('2024-01-15T11:30:00Z').getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toBe('30분 전');
    });

    it('should return hours ago for same day', () => {
      const timestamp = new Date('2024-01-15T08:00:00Z').getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toBe('4시간 전');
    });

    it('should return "어제" for yesterday', () => {
      const timestamp = new Date('2024-01-14T12:00:00Z').getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toBe('어제');
    });

    it('should return formatted date for older dates', () => {
      const timestamp = new Date('2024-01-10T10:00:00Z').getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toBe('2024.01.10');
    });

    it('should handle edge case at midnight', () => {
      const timestamp = new Date('2024-01-15T00:00:00Z').getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toBe('12시간 전');
    });
  });
});
