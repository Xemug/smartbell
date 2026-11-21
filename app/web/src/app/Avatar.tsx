import { useState } from 'react';

import { mediaUrl } from '../api/client';
import { cx } from '../ui/cx';
import { Illustration } from '../ui/icons/Illustration';

/** The user's photo, or the kit's avatar when there is none or it fails to load. */
export function Avatar({ photoUrl, className }: { photoUrl?: string | null; className?: string }) {
  const src = mediaUrl(photoUrl);
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return <Illustration name="avatar" alt="" className={cx('rounded-full', className)} />;
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(src)}
      className={cx('rounded-full object-cover', className)}
    />
  );
}
