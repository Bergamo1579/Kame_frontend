// filepath: c:\Users\anderson.bergamo\Videos\Kame\Kame_frontend\src\utils\formatters.js

// Formatar CPF/CNPJ
export const formatCPFCNPJ = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // CPF: 000.000.000-00
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  
  // CNPJ: 00.000.000/0000-00
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18); // Limita a 18 caracteres (CNPJ completo)
};

// Remover formatação de CPF/CNPJ (para enviar à API)
export const unformatCPFCNPJ = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Formatar Telefone
export const formatPhone = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // (00) 0000-0000 ou (00) 00000-0000
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    .slice(0, 15); // Limita a 15 caracteres
};

// Remover formatação de Telefone (para enviar à API)
export const unformatPhone = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Validar CPF
export const isValidCPF = (cpf) => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

// Validar CNPJ
export const isValidCNPJ = (cnpj) => {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Valida primeiro dígito verificador
  let length = numbers.length - 2;
  let numbersList = numbers.substring(0, length);
  const digits = numbers.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbersList.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Valida segundo dígito verificador
  length = length + 1;
  numbersList = numbers.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbersList.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};