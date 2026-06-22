'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore, type ToastVariant } from '@/store/ui-store';

const icons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles: Record<ToastVariant, string> = {
  success: 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald',
  error: 'border-accent-rose/30 bg-accent-rose/10 text-accent-rose',
  info: 'border-brand/30 bg-brand/10 text-brand-hover',
  warning: 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber',
};

function ToastItem({ id, title, message, variant }: {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}) {
  const removeToast = useUiStore((s) => s.removeToast);
  const Icon = icons[variant];

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 5000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);

  return (
    <div
      role="alert"
      className={cn(
        'animate-slide-up flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
        styles[variant],
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        {message && <p className="mt-0.5 text-xs text-gray-300">{message}</p>}
      </div>
      <button
        onClick={() => removeToast(id)}
        className="rounded p-0.5 text-gray-400 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
