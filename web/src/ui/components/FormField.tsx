import type { ReactNode } from 'react';
import { Label } from '@ui/components/ui/label';

type Props = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ id, label, error, children }: Props) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
