import type { ImgHTMLAttributes } from 'react';

import type { IllustrationName } from './index';

type IllustrationProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  name: IllustrationName;
  /** Pass an empty string for a decorative illustration. */
  alt: string;
};

// Mascots and logos are heavier than icons, so they stay in public/ and load as files.
export function Illustration({ name, alt, ...props }: IllustrationProps) {
  return <img src={`/illustrations/${name}.svg`} alt={alt} {...props} />;
}
