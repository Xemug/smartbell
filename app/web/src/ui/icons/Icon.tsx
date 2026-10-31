import type { SVGProps } from 'react';

import { icons, type IconName } from './index';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name' | 'children' | 'width' | 'height'> & {
  name: IconName;
  /** Height in px; width follows the icon's own proportions. */
  size?: number;
  /** Accessible name. Without it the icon is decorative and hidden from screen readers. */
  title?: string;
};

// Line icons paint with `currentColor`, so they follow the text colour. Colour icons keep the
// brand colours from Figma. The markup comes from our own SVG files, never from user input.
export function Icon({ name, size = 24, title, ...props }: IconProps) {
  const { viewBox, body } = icons[name];
  const [, , width = 1, height = 1] = viewBox.split(' ').map(Number);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={(size * width) / height}
      height={size}
      fill="none"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
      {...props}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
