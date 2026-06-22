'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto w-full rounded-xl border border-surface-border bg-surface-raised p-0 text-gray-100 shadow-2xl backdrop:bg-black/60',
        sizeClasses[size],
      )}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
        <div>
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          {description && (
            <p id="modal-description" className="mt-1 text-sm text-gray-400">
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-6 py-4">{children}</div>
      {footer && (
        <div className="flex justify-end gap-3 border-t border-surface-border px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
