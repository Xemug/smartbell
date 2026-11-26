import type { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormField } from '../../../ui/FormField';
import { Select } from '../../../ui/Select';
import type { AnimalValues } from './formModel';
import { availabilityOptions } from './options';

/**
 * Fields that only a male has, shown in the detailed form when Macho is chosen: how the bull is
 * available for service. It starts on "En rancho", so a bull registered in quick mode is on the
 * ranch, as bull records always were.
 */
export function BullSection({ control }: { control: Control<AnimalValues> }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="bullAvailability"
      render={(field) => (
        <Select
          {...field}
          required
          label={t('animalForm.fields.bullAvailability')}
          options={availabilityOptions(t)}
          className="col-span-2"
        />
      )}
    />
  );
}
