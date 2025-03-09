import {
  formatDuration,
  formatTimestamp,
  formatContentCategory,
  getAlgorithmColor,
  getCategoryColor
} from '../formatting';

describe('formatDuration', () => {
  // Normal cases
  test('formats seconds correctly', () => {
    expect(formatDuration(30)).toBe('30s');
  });

  test('formats minutes correctly', () => {
    expect(formatDuration(120)).toBe('2m');
  });

  test('formats hours correctly', () => {
    expect(formatDuration(7200)).toBe('2h');
  });

  test('formats days correctly', () => {
    expect(formatDuration(172800)).toBe('2d 0h');
  });

  test('formats days and hours correctly', () => {
    expect(formatDuration(129600)).toBe('1d 12h');
  });

  // Edge cases
  test('handles zero seconds', () => {
    expect(formatDuration(0)).toBe('None');
  });

  test('handles exact minute boundary', () => {
    expect(formatDuration(60)).toBe('1m');
  });

  test('handles exact hour boundary', () => {
    expect(formatDuration(3600)).toBe('1h');
  });

  test('handles exact day boundary', () => {
    expect(formatDuration(86400)).toBe('1d 0h');
  });

  // Invalid inputs
  test('handles negative values by treating them as zero', () => {
    expect(formatDuration(-100)).toBe('None');
  });

  test('handles non-integer values by rounding down', () => {
    expect(formatDuration(65.7)).toBe('1m');
  });
});

describe('formatTimestamp', () => {
  // Normal case
  test('formats valid timestamp', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    jest.spyOn(date, 'toLocaleString').mockReturnValue('1/1/2023, 12:00:00 PM');
    
    // Mock the Date constructor to return our fixed date
    const originalDate = global.Date;
    global.Date = jest.fn(() => date) as any;
    global.Date.UTC = originalDate.UTC;
    
    expect(formatTimestamp('2023-01-01T12:00:00Z')).toBe('1/1/2023, 12:00:00 PM');
    
    // Restore the original Date
    global.Date = originalDate;
  });

  // Edge cases
  test('handles undefined timestamp', () => {
    expect(formatTimestamp(undefined)).toBe('N/A');
  });

  test('handles empty string', () => {
    expect(formatTimestamp('')).toBe('N/A');
  });

  // Invalid inputs
  test('handles invalid date format', () => {
    expect(formatTimestamp('not-a-date')).not.toBe('N/A'); // It will return a string but not 'N/A'
  });
});

describe('formatContentCategory', () => {
  // Normal cases
  test('formats simple category correctly', () => {
    expect(formatContentCategory('fowl_play')).toBe('Fowl Play');
  });

  test('formats multi-word category correctly', () => {
    expect(formatContentCategory('wild_duckery')).toBe('Wild Duckery');
  });

  // Edge cases
  test('handles empty string', () => {
    expect(formatContentCategory('')).toBe('');
  });

  // Invalid inputs
  test('handles category with incorrect separators', () => {
    expect(formatContentCategory('hate-speech')).toBe('Hate-speech');
  });

  test('preserves uppercase letters', () => {
    expect(formatContentCategory('HATE_speech')).toBe('HATE Speech');
  });
});

describe('getAlgorithmColor', () => {
  // Normal cases
  test('returns correct color for pdq algorithm', () => {
    expect(getAlgorithmColor('pdq')).toBe('blue');
  });

  test('returns correct color for md5 algorithm', () => {
    expect(getAlgorithmColor('md5')).toBe('purple');
  });

  test('returns correct color for sha1 algorithm', () => {
    expect(getAlgorithmColor('sha1')).toBe('teal');
  });

  // Edge cases
  test('handles uppercase algorithm names', () => {
    expect(getAlgorithmColor('PDQ')).toBe('blue');
  });

  // Invalid inputs
  test('returns gray for unknown algorithm', () => {
    expect(getAlgorithmColor('unknown')).toBe('gray');
  });

  test('handles empty string', () => {
    expect(getAlgorithmColor('')).toBe('gray');
  });
});

describe('getCategoryColor', () => {
  // Normal cases
  test('returns correct color for fowl_play category', () => {
    expect(getCategoryColor('fowl_play')).toBe('red');
  });

  test('returns correct color for wild_duckery category', () => {
    expect(getCategoryColor('wild_duckery')).toBe('blue');
  });

  test('returns correct color for rotten_eggs category', () => {
    expect(getCategoryColor('rotten_eggs')).toBe('yellow');
  });

  // Edge cases
  test('handles uppercase category names', () => {
    expect(getCategoryColor('ADULT')).toBe('pink');
  });

  // Invalid inputs
  test('returns gray for unknown category', () => {
    expect(getCategoryColor('unknown')).toBe('gray');
  });

  test('handles empty string', () => {
    expect(getCategoryColor('')).toBe('gray');
  });
}); 