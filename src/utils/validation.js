/**
 * Utilitários de validação centralizados
 * Elimina repetições de código de validação entre componentes
 */

// Validações básicas
export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'Este campo é obrigatório';
    }
    return null;
  },

  minLength: (value, min) => {
    if (value && value.trim().length < min) {
      return `Deve ter pelo menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (value, max) => {
    if (value && value.trim().length > max) {
      return `Deve ter no máximo ${max} caracteres`;
    }
    return null;
  },

  cpf: (value) => {
    if (!value) return null;
    const cleanCpf = value.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return 'CPF deve ter 11 dígitos';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email deve ter um formato válido';
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    
    const errors = [];
    if (value.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(value)) errors.push('Uma letra maiúscula');
    if (!/[a-z]/.test(value)) errors.push('Uma letra minúscula');
    if (!/[0-9]/.test(value)) errors.push('Um número');
    
    return errors.length > 0 ? `Senha deve conter: ${errors.join(', ')}` : null;
  }
};

// Validadores compostos para entidades específicas
export const entityValidators = {
  aluno: (data) => {
    const errors = {};
    
    // Nome
    const nomeError = validators.required(data.nome) || validators.minLength(data.nome, 3) || validators.maxLength(data.nome, 150);
    if (nomeError) errors.nome = nomeError;
    
    // CPF
    const cpfError = validators.required(data.cpf) || validators.cpf(data.cpf);
    if (cpfError) errors.cpf = cpfError;
    
    // Data de nascimento
    if (!data.data_nascimento) {
      errors.data_nascimento = 'Data de nascimento é obrigatória';
    }
    
    return errors;
  },

  turma: (data) => {
    const errors = {};
    
    // Nome
    const nomeError = validators.required(data.nome) || validators.minLength(data.nome, 3) || validators.maxLength(data.nome, 100);
    if (nomeError) errors.nome = nomeError;
    
    // Unidade
    if (!data.id_unidade) {
      errors.id_unidade = 'Unidade é obrigatória';
    }
    
    return errors;
  },

  unidade: (data) => {
    const errors = {};
    
    // Nome
    const nomeError = validators.required(data.nome) || validators.minLength(data.nome, 3) || validators.maxLength(data.nome, 100);
    if (nomeError) errors.nome = nomeError;
    
    return errors;
  },

  instrutor: (data, isCreate = false) => {
    const errors = {};
    
    // Nome
    const nomeError = validators.required(data.nome) || validators.minLength(data.nome, 3) || validators.maxLength(data.nome, 100);
    if (nomeError) errors.nome = nomeError;
    
    // Login
    const loginError = validators.required(data.login) || validators.minLength(data.login, 3) || validators.maxLength(data.login, 50);
    if (loginError) errors.login = loginError;
    
    // Senha (obrigatória na criação)
    if (isCreate && !data.senha) {
      errors.senha = 'Senha é obrigatória para novos instrutores';
    } else if (data.senha) {
      const senhaError = validators.password(data.senha);
      if (senhaError) errors.senha = senhaError;
    }
    
    return errors;
  },

  empresa: (data, isCreate = false) => {
    const errors = {};
    
    // Nome
    const nomeError = validators.required(data.nome) || validators.minLength(data.nome, 3) || validators.maxLength(data.nome, 150);
    if (nomeError) errors.nome = nomeError;
    
    // Login
    const loginError = validators.required(data.login) || validators.minLength(data.login, 3) || validators.maxLength(data.login, 50);
    if (loginError) errors.login = loginError;
    
    // Senha (obrigatória na criação)
    if (isCreate && !data.senha) {
      errors.senha = 'Senha é obrigatória para novas empresas';
    } else if (data.senha) {
      const senhaError = validators.password(data.senha);
      if (senhaError) errors.senha = senhaError;
    }
    
    return errors;
  },

  agendamento: (data) => {
    const errors = {};
    
    if (!data.id_unidade) errors.id_unidade = 'Unidade é obrigatória';
    if (!data.turma_id) errors.turma_id = 'Turma é obrigatória';
    if (!data.aula_id) errors.aula_id = 'Aula é obrigatória';
    if (!data.data_aula) errors.data_aula = 'Data é obrigatória';
    if (!data.horario_inicio) errors.horario_inicio = 'Horário de início é obrigatório';
    
    // Validar horários
    if (data.horario_inicio && data.horario_fim && data.horario_fim <= data.horario_inicio) {
      errors.horario_fim = 'Horário de fim deve ser posterior ao início';
    }
    
    return errors;
  }
};

// Função helper para verificar se formulário é válido
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

// Função helper para validar e retornar se é válido
export const validateAndCheck = (validatorFn, data, ...args) => {
  const errors = validatorFn(data, ...args);
  return {
    errors,
    isValid: isFormValid(errors)
  };
};