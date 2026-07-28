import React from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';

const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    info: {
      icon: FaInfoCircle,
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      iconColor: 'text-blue-400'
    },
    success: {
      icon: FaCheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-800',
      iconColor: 'text-green-400'
    },
    warning: {
      icon: FaExclamationTriangle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-400'
    },
    error: {
      icon: FaExclamationCircle,
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      iconColor: 'text-red-400'
    }
  };

  const config = types[type] || types.info;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border-l-4 ${config.border} p-4 rounded-r-lg flex items-start gap-3`}>
      <Icon className={`${config.iconColor} text-xl flex-shrink-0 mt-0.5`} />
      <p className={`${config.text} flex-1 text-sm`}>{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;