import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface FieldFrameProps {
  readonly id: string;
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
  readonly children: React.ReactNode;
}
export function FieldFrame({ id, label, error, hint, children }: FieldFrameProps) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div aria-describedby={describedBy}>{children}</div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 disabled:bg-slate-100',
        className,
      )}
      {...props}
    />
  );
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 disabled:bg-slate-100',
        className,
      )}
      {...props}
    />
  );
});
