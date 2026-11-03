import { Link } from 'react-router-dom';

import { cx, focusRing } from '../../ui/cx';

/** The footer line under each form, e.g. "¿Ya tienes cuenta? Da click aquí". */
export function SwitchLink({
  question,
  action,
  to,
}: {
  question: string;
  action: string;
  to: string;
}) {
  return (
    <p className="text-center text-primary type-body-md">
      {question}{' '}
      <Link to={to} className={cx('font-semibold text-primary underline', focusRing)}>
        {action}
      </Link>
    </p>
  );
}
