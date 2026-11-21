import { describe, expect, it } from 'vitest';

import { mediaUrl } from './client';

describe('mediaUrl', () => {
  it('puts our media paths on the API base and leaves absolute URLs alone', () => {
    expect(mediaUrl('/api/media/avatars/a.png')).toBe(
      `${window.location.origin}/api/media/avatars/a.png`,
    );
    expect(mediaUrl('https://lh3.googleusercontent.com/x')).toBe(
      'https://lh3.googleusercontent.com/x',
    );
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });
});
