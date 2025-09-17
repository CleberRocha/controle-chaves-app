import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

//export const API_URL = 'http://10.0.2.2:3001';
export const API_URL = 'https://sulcleansm.ddns.com.br:3001';
// --- Navegação Global e Controle de Autenticação ---
let navigator;
let onUnauthorizedCallback = () => {}; 

export function setTopLevelNavigator(navigatorRef) {
  navigator = navigatorRef;
}

export function setOnUnauthorizedCallback(callback) {
  onUnauthorizedCallback = callback;
}

// No ficheiro: apiService.tsx

const handleUnauthorized = async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('operador');
  
  
  onUnauthorizedCallback();

  
  Alert.alert('Sessão Expirada', 'Por favor, faça o login novamente.');

  setTimeout(() => {
    if (navigator) {
      navigator.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, 0);
};

// --- NOVA FUNÇÃO DE LOGOUT ---
export const logout = async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('operador');
  onUnauthorizedCallback(); 
};


const getToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    return null;
  }
  return token;
};


const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = await getToken();
    if (!token) {
      await handleUnauthorized();
      return { ok: false, status: 401, json: () => Promise.resolve(null) };
    }

    const defaultHeaders = { 'Authorization': `Bearer ${token}` };

    if (!(options.body instanceof FormData) && !options.headers?.['Content-Type']) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    if (response.status === 401 || response.status === 403) {
  await handleUnauthorized();
  return { ok: false, status: response.status, json: () => Promise.resolve(null) };
}
    
    return response;

  } catch (error) {
    console.error(`Erro de rede na requisição para ${endpoint}:`, error.message);
    Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
    return { ok: false, status: 0, json: () => Promise.resolve(null) };
  }
};

// --- Funções para Pessoas ---
export const getPessoas = (searchTerm = '') => fetchWithAuth(`/api/pessoas?search=${encodeURIComponent(searchTerm)}`);
export const getPessoa = (id) => fetchWithAuth(`/api/pessoas/${id}`);
export const createPessoa = (formData) => fetchWithAuth('/api/pessoas', { method: 'POST', body: formData });
export const updatePessoa = (id, formData) => fetchWithAuth(`/api/pessoas/${id}`, { method: 'PUT', body: formData });
export const updatePessoaStatus = (id, ativo) => fetchWithAuth(`/api/pessoas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) });

// --- Funções para Perfis ---
export const getPerfis = () => fetchWithAuth('/api/perfis');
export const createPerfil = (data) => fetchWithAuth('/api/perfis', { method: 'POST', body: JSON.stringify(data) });
export const updatePerfil = (id, data) => fetchWithAuth(`/api/perfis/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePerfil = (id) => fetchWithAuth(`/api/perfis/${id}`, { method: 'DELETE' });

// --- Funções para Chaves ---
export const getChaves = (searchTerm = '') => fetchWithAuth(`/api/chaves?search=${encodeURIComponent(searchTerm)}`);
export const getChaveDetails = (id) => fetchWithAuth(`/api/chaves/${id}/details`);
export const createChave = (data) => fetchWithAuth('/api/chaves', { method: 'POST', body: JSON.stringify(data) });
export const updateChave = (id, data) => fetchWithAuth(`/api/chaves/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// --- Funções para Locais ---
export const getLocais = () => fetchWithAuth('/api/locais');
export const createLocal = (data) => fetchWithAuth('/api/locais', { method: 'POST', body: JSON.stringify(data) });
export const updateLocal = (id, data) => fetchWithAuth(`/api/locais/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteLocal = (id) => fetchWithAuth(`/api/locais/${id}`, { method: 'DELETE' });

// --- Funções para Empréstimos (Registros) ---
export const getChavesDisponiveis = (pessoaId) => fetchWithAuth(`/api/chaves/disponiveis/${pessoaId}`);
export const createRegistro = (data) => fetchWithAuth('/api/registros/retirada-massa', { method: 'POST', body: JSON.stringify(data) });
export const devolverChave = (chaveId, observacao = '') => fetchWithAuth('/api/registros/devolucao', { 
  method: 'PUT', 
  body: JSON.stringify({ chave_id: chaveId, observacao }) 
});

// --- Funções de Relatórios ---
export const getRelatorioMovimentacoes = (params) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/relatorios/movimentacoes?${query}`);
};

// --- Funções de Ocorrências ---
export const getOcorrencias = () => fetchWithAuth('/api/ocorrencias');
export const createOcorrencia = (formData) => fetchWithAuth('/api/ocorrencias', { 
    method: 'POST', 
    body: formData 
});

// --- FUNÇÃO CORRIGIDA PARA ALTERAR SENHA ---
export const alterarSenha = (data) => fetchWithAuth('/api/operadores/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
});

