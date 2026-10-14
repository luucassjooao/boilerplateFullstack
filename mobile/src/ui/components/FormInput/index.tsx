import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import { FormGroup } from '@ui/components/FormGroup';
import { Input } from '@ui/components/Input';

type Props<T extends FieldValues> = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

/** RHF Controller + FormGroup + Input: React Native inputs have no `register`. */
export function FormInput<T extends FieldValues>({ control, name, label, ...inputProps }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormGroup label={label} error={fieldState.error?.message}>
          <Input
            accessibilityLabel={label}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            invalid={!!fieldState.error}
            {...inputProps}
          />
        </FormGroup>
      )}
    />
  );
}
