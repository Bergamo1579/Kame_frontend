/**
 * Utilitários de formatação centralizados
 * Elimina repetições de código de formatação entre componentes
 */

// Formatadores básicos
export const formatters = {
  cpf: (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  phone: (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  },

  date: (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  },

  dateForInput: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  },

  time: (timeString) => {
    if (!timeString) return '';
    
    try {
      // Se o tempo contém mais que HH:MM, extrair apenas a parte necessária
      const timeOnly = timeString.includes(':') ? timeString.substring(0, 5) : timeString;
      
      // Verificar se está no formato HH:MM
      const timeRegex = /^\d{2}:\d{2}$/;
      if (timeRegex.test(timeOnly)) {
        return timeOnly;
      }
      
      return timeString;
    } catch (error) {
      return timeString;
    }
  },

  currency: (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  percentage: (value) => {
    if (!value && value !== 0) return '';
    return `${value}%`;
  }
};

// Formatadores de entrada (input masks)
export const inputFormatters = {
  cpfInput: (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '').substring(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  },

  phoneInput: (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '').substring(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  },

  timeInput: (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '').substring(0, 4);
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
  }
};

// Funções de limpeza
export const cleaners = {
  cpf: (value) => {
    return value ? value.replace(/\D/g, '') : '';
  },

  phone: (value) => {
    return value ? value.replace(/\D/g, '') : '';
  },

  numbers: (value) => {
    return value ? value.replace(/\D/g, '') : '';
  },

  text: (value) => {
    return value ? value.trim() : '';
  }
};

// Validadores de formato
export const formatValidators = {
  isCpfComplete: (value) => {
    const clean = cleaners.cpf(value);
    return clean.length === 11;
  },

  isPhoneComplete: (value) => {
    const clean = cleaners.phone(value);
    return clean.length === 10 || clean.length === 11;
  },

  isTimeValid: (value) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(value);
  },

  isDateValid: (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
};

// Função helper para aplicar formatação em tempo real
export const applyFormat = (value, formatterName) => {
  const formatter = inputFormatters[formatterName];
  return formatter ? formatter(value) : value;
};

// Função helper para limpar valor antes de enviar ao backend
export const cleanForSubmit = (value, cleanerName) => {
  const cleaner = cleaners[cleanerName];
  return cleaner ? cleaner(value) : value;
};