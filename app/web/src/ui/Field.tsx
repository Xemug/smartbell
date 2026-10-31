import { useId, type ReactNode } from 'react';

import { cx } from './cx';
import { iconAlertCircle } from './icons/glyphs';
import { Icon } from './icons/Icon';

export interface FieldProps {
  label?: string;
  hint?: string;
  /** Message shown under the control; also marks it invalid. */
  error?: string;
  required?: boolean;
}

export interface FieldSlot {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

type FieldLayoutProps = FieldProps & {
  /** The label is drawn by the control itself (floating label). */
  hideLabel?: boolean;
  /** For groups: the label names a group, so it is not tied to one control. */
  group?: boolean;
  className?: string;
  children: (slot: FieldSlot, labelId: string | undefined) => ReactNode;
};

// Label, control and helper text, wired together for assistive tech.
export function Field({
  label,
  hint,
  error,
  required,
  hideLabel,
  group,
  className,
  children,
}: FieldLayoutProps) {
  const id = useId();
  const labelId = label ? `${id}-label` : undefined;
  const messageId = error || hint ? `${id}-message` : undefined;
  const LabelTag = group ? 'span' : 'label';
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      {label && !hideLabel && (
        <LabelTag id={labelId} htmlFor={group ? undefined : id} className="type-label-md">
          {label}
          {required && (
            <span aria-hidden className="text-error">
              {' *'}
            </span>
          )}
        </LabelTag>
      )}
      {children(
        { id, 'aria-describedby': messageId, 'aria-invalid': error ? true : undefined },
        labelId,
      )}
      {error ? (
        // Red on the #F9F9F9 page is 4.3:1, under AA for this size, so the icon carries the colour.
        <p id={messageId} className="flex items-start gap-1 type-body-sm">
          <Icon icon={iconAlertCircle} size={16} className="shrink-0 text-error" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="type-body-sm text-secondary-text">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
