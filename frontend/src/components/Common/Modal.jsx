import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showFooter = true,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary'
}) => {
  useEffect(() => {
    if (isOpen) {

      
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  const confirmColors = {
    primary: 'btn-primary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] flex flex-col`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="flex justify-end gap-3 p-6 border-t flex-shrink-0">
            <button onClick={onClose} className="btn-outline">
              {cancelText}
            </button>
            {onConfirm && (
              <button onClick={onConfirm} className={confirmColors[confirmVariant] || 'btn-primary'}>
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;