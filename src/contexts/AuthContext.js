import React, { createContext, useState, useEffect } from 'react';
import { loginRequest, getProfile } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token no localStorage ao carregar
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await getProfile();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await loginRequest(credentials);
      const { access_token } = response.data;
      
      if (!access_token) {
        throw new Error('Token não encontrado na resposta');
      }
      
      // Salva o token
      localStorage.setItem('token', access_token);
      
      // Busca os dados do usuário usando o token
      try {
        const profileResponse = await getProfile();
        setCurrentUser(profileResponse.data);
      } catch (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        // Se falhar ao buscar o perfil, ainda mantém o token
        setCurrentUser({ authenticated: true });
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
