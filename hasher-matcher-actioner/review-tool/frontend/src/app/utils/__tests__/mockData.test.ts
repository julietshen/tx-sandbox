import {
  getMockQueueStats,
  getMockQueueConfig,
  getMockCategoryDescription,
  getMockTask,
} from '../mockData';

describe('getMockQueueStats', () => {
  // Normal cases
  test('returns valid queue stats object', () => {
    const stats = getMockQueueStats();
    expect(stats).toHaveProperty('pending_count');
    expect(stats).toHaveProperty('oldest_task_age');
    expect(typeof stats.pending_count).toBe('number');
    expect(typeof stats.oldest_task_age).toBe('number');
  });

  test('returns stats with positive pending count', () => {
    const stats = getMockQueueStats();
    expect(stats.pending_count).toBeGreaterThan(0);
  });

  test('returns stats with positive oldest task age', () => {
    const stats = getMockQueueStats();
    expect(stats.oldest_task_age).toBeGreaterThan(0);
  });

  // Function doesn't accept parameters, so no edge/invalid cases to test
});

describe('getMockQueueConfig', () => {
  // Normal cases
  test('returns valid queue config object', () => {
    const config = getMockQueueConfig();
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('image_hash_algorithm');
    expect(config).toHaveProperty('content_categories');
    expect(Array.isArray(config.content_categories)).toBeTruthy();
  });

  test('returns config with expected algorithms', () => {
    const config = getMockQueueConfig();
    expect(['pdq', 'md5', 'sha1']).toContain(config.image_hash_algorithm);
  });

  test('returns config with at least one content category', () => {
    const config = getMockQueueConfig();
    expect(config.content_categories.length).toBeGreaterThan(0);
  });

  // Function doesn't accept parameters, so no edge/invalid cases to test
});

describe('getMockCategoryDescription', () => {
  // Normal cases
  test('returns description for adult category', () => {
    const description = getMockCategoryDescription('adult');
    expect(description).toContain('Content containing');
    expect(description.length).toBeGreaterThan(20);
  });

  test('returns description for hate_speech category', () => {
    const description = getMockCategoryDescription('hate_speech');
    expect(description).toContain('Content containing');
    expect(description.length).toBeGreaterThan(20);
  });

  // Edge cases
  test('accepts uppercase category names', () => {
    const description = getMockCategoryDescription('ADULT');
    expect(description).toContain('Content containing');
  });

  // Invalid inputs
  test('returns default description for unknown category', () => {
    const description = getMockCategoryDescription('unknown_category');
    expect(description).toBe('Content that violates our policies');
  });

  test('handles empty string', () => {
    const description = getMockCategoryDescription('');
    expect(description).toBe('Content that violates our policies');
  });
});

describe('getMockTask', () => {
  // Normal cases
  test('returns task with all required properties', () => {
    const task = getMockTask();
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('created_at');
    expect(task).toHaveProperty('hash_value');
    expect(task).toHaveProperty('source_id');
    expect(task).toHaveProperty('algorithm');
    expect(task).toHaveProperty('content_category');
    expect(task).toHaveProperty('image_urls');
    expect(Array.isArray(task.image_urls)).toBeTruthy();
  });

  test('returns task with valid algorithm', () => {
    const task = getMockTask();
    expect(['pdq', 'md5', 'sha1']).toContain(task.algorithm);
  });

  test('returns task with valid content category', () => {
    const task = getMockTask();
    expect(['adult', 'hate_speech', 'violence']).toContain(task.content_category);
  });

  test('returns task with at least one image URL', () => {
    const task = getMockTask();
    expect(task.image_urls.length).toBeGreaterThan(0);
  });

  // Edge cases
  test('generates unique task IDs', () => {
    const task1 = getMockTask();
    const task2 = getMockTask();
    expect(task1.id).not.toBe(task2.id);
  });

  test('generates unique hash values', () => {
    const task1 = getMockTask();
    const task2 = getMockTask();
    expect(task1.hash_value).not.toBe(task2.hash_value);
  });

  // Function doesn't accept parameters for invalid inputs testing
}); 