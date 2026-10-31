import type { ReactElement } from 'react';
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface FormFieldProps<Values extends FieldValues, Name extends FieldPath<Values>> {
  control: Control<Values>;
  name: Name;
  /** Spread the props onto any kit control: they all take value, onChange, onBlur and error. */
  render: (props: ControllerRenderProps<Values, Name> & { error?: string }) => ReactElement;
}

// Binds a kit control to react-hook-form. Zod messages may be i18n keys ("validation.required")
// or literal text, which passes through untranslated.
export function FormField<Values extends FieldValues, Name extends FieldPath<Values>>({
  control,
  name,
  render,
}: FormFieldProps<Values, Name>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message;
        return render({ ...field, error: message && t(message, { defaultValue: message }) });
      }}
    />
  );
}
