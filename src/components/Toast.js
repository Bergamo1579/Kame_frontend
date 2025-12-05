import React from 'react';
import { X } from 'lucide-react';

export default function Toast({ show, message, type, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slideIn">
      <div className={`
        flex items-center gap-3 min-w-[320px] max-w-md
        px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm
        border-l-4 transform transition-all duration-300
        ${type === 'success' 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500' 
          : type === 'error' 
          ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500'
        }
      `}>
        {/* Ícone animado */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
        `}>
          {type === 'success' && (
            <svg className="w-6 h-6 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        {/* Mensagem */}
        <div className="flex-1">
          <p className={`font-semibold text-sm leading-tight ${
            type === 'success' 
              ? 'text-green-900' 
              : type === 'error'
              ? 'text-red-900'
              : 'text-blue-900'
          }`}>
            {message}
          </p>
        </div>
        
        {/* Botão fechar */}
        <button 
          onClick={onClose}
          className={`
            flex-shrink-0 p-1 rounded-lg transition-colors
            ${type === 'success' 
              ? 'hover:bg-green-200 text-green-700' 
              : type === 'error' 
              ? 'hover:bg-red-200 text-red-700' 
              : 'hover:bg-blue-200 text-blue-700'
            }
          `}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
