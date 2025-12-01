import { ReactNode } from 'react';
import { XIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full ${sizeClasses[size]} mx-4 bg-card rounded-xl shadow-lg animate-scaleIn`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <XIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
