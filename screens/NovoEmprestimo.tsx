import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Alert, FlatList,
  TouchableWithoutFeedback, StyleSheet, SafeAreaView,
  TextInput, Image, ActivityIndicator, ScrollView
} from 'react-native';
import { ChevronDown, Check, X, Search, User, MapPin, Key, CheckSquare, Square } from 'lucide-react-native';
import { getPessoas, getChavesDisponiveis, createRegistro, API_URL, getLocais } from '../services/apiService';

// Componente de botão de seleção reutilizável
const SelectionButton = ({ label, value, placeholder, onPress, enabled }) => (
  <View style={styles.selectionContainer}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity onPress={onPress} disabled={!enabled} style={[styles.button, !enabled && styles.buttonDisabled]}>
      <Text style={value ? styles.buttonText : styles.placeholderText} numberOfLines={1}>{value || placeholder}</Text>
      <ChevronDown size={20} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

export const NovoEmprestimo = ({ navigation }) => {
  // Estados para dados da API
  const [todasPessoas, setTodasPessoas] = useState([]);
  const [todosLocais, setTodosLocais] = useState([]);
  const [chavesDisponiveis, setChavesDisponiveis] = useState([]);

  // Estados de seleção do formulário
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
  const [localFiltro, setLocalFiltro] = useState(null); // Filtro de local
  const [chavesSelecionadas, setChavesSelecionadas] = useState([]); // Múltiplas chaves

  // Estados de UI
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', items: [], onSelect: () => {}, type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChavesLoading, setIsChavesLoading] = useState(false);

  // Carrega pessoas e locais ao iniciar a tela
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const [pessoasRes, locaisRes] = await Promise.all([getPessoas(), getLocais()]);
        if (!pessoasRes.ok || !locaisRes.ok) throw new Error('Falha ao carregar dados iniciais.');
        
        const pessoasData = await pessoasRes.json();
        const locaisData = await locaisRes.json();
        
        setTodasPessoas(pessoasData.filter(p => p.ativo));
        setTodosLocais(locaisData);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os dados necessários.");
      } finally {
        setIsLoading(false);
      }
    };
    carregarDadosIniciais();
  }, []);

  // Carrega chaves disponíveis sempre que uma pessoa é selecionada
  useEffect(() => {
    const carregarChaves = async () => {
      if (pessoaSelecionada) {
        setIsChavesLoading(true);
        setChavesSelecionadas([]);
        setLocalFiltro(null);
        try {
          const response = await getChavesDisponiveis(pessoaSelecionada.id);
          if (!response.ok) throw new Error('Falha ao carregar chaves disponíveis.');
          const data = await response.json();
          setChavesDisponiveis(data);
        } catch (error) {
          Alert.alert("Erro", error.message || "Não foi possível carregar as chaves para esta pessoa.");
          setChavesDisponiveis([]);
        } finally {
          setIsChavesLoading(false);
        }
      }
    };
    carregarChaves();
  }, [pessoaSelecionada]);

  // Abre o modal genérico
  const openModal = (title, items, onSelect, type) => {
    setModalConfig({ title, items, onSelect, type });
    setSearchTerm('');
    setModalVisible(true);
  };
  
  // Lida com a seleção de múltiplas chaves
  const handleToggleChave = (chave) => {
    setChavesSelecionadas(prev => 
      prev.some(c => c.id === chave.id)
        ? prev.filter(c => c.id !== chave.id)
        : [...prev, chave]
    );
  };

  // Registra o empréstimo com múltiplas chaves
  const registrarEmprestimo = async () => {
    if (!pessoaSelecionada || chavesSelecionadas.length === 0) {
      Alert.alert('Atenção', 'É necessário selecionar uma pessoa e pelo menos uma chave.');
      return;
    }

    try {
      const response = await createRegistro({
        pessoa_id: pessoaSelecionada.id,
        chaves_ids: chavesSelecionadas.map(c => c.id), // Envia array de IDs
      });

      // AJUSTE PARA LIDAR COM RESPOSTAS NÃO-JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Resposta de erro do servidor:", errorText);
        // Tenta extrair uma mensagem de erro JSON, se houver
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || "Erro desconhecido do servidor.");
        } catch (e) {
          // Se não for JSON, lança o erro genérico
          throw new Error("Erro ao registrar empréstimo. Verifique os logs do servidor.");
        }
      }
      
      Alert.alert('Sucesso', 'Empréstimo registrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  // Filtra itens do modal com base na busca e no tipo
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return modalConfig.items;
    
    switch (modalConfig.type) {
      case 'pessoas':
        return modalConfig.items.filter(p => p.nome_completo.toLowerCase().includes(term));
      case 'locais':
        return modalConfig.items.filter(l => l.nome.toLowerCase().includes(term));
      case 'chaves':
        return modalConfig.items.filter(c => c.codigo_chave.toLowerCase().includes(term) || c.local_nome.toLowerCase().includes(term));
      default:
        return modalConfig.items;
    }
  }, [searchTerm, modalConfig]);
  
  // Filtra as chaves para exibição no modal, com base no local selecionado
  const chavesParaModal = useMemo(() => {
      if (!localFiltro) return chavesDisponiveis;
      return chavesDisponiveis.filter(c => c.local_id === localFiltro.id);
  }, [localFiltro, chavesDisponiveis]);


  if (isLoading) {
      return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView>
          <Text style={styles.headerTitle}>Novo Empréstimo</Text>
          
          <SelectionButton
            label="Para quem é o empréstimo?"
            value={pessoaSelecionada?.nome_completo}
            placeholder="Selecione uma pessoa"
            enabled={!isLoading}
            onPress={() => openModal("Selecione a Pessoa", todasPessoas, (p) => { setPessoaSelecionada(p); setModalVisible(false); }, 'pessoas')}
          />

          {pessoaSelecionada && (
            <View style={styles.cardPessoa}>
              <Image source={{ uri: pessoaSelecionada.foto_url ? `${API_URL}/${pessoaSelecionada.foto_url.replace(/\\/g, '/')}` : 'https://placehold.co/64' }} style={styles.cardPessoaImage} />
              <View>
                <Text style={styles.cardPessoaName}>{pessoaSelecionada.nome_completo}</Text>
                <Text style={styles.cardPessoaMatricula}>Matrícula: {pessoaSelecionada.identificador_funcional}</Text>
              </View>
            </View>
          )}

          <SelectionButton
            label="Filtrar chaves por local (opcional)"
            value={localFiltro?.nome}
            placeholder="Todos os locais"
            enabled={!!pessoaSelecionada}
            onPress={() => openModal("Filtrar por Local", [{id: null, nome: 'Todos os locais'}, ...todosLocais], (l) => { setLocalFiltro(l.id ? l : null); setModalVisible(false); }, 'locais')}
          />
          
           <View style={styles.selectionContainer}>
            <Text style={styles.label}>Quais chaves serão emprestadas?</Text>
            <TouchableOpacity 
              onPress={() => openModal("Selecione as Chaves", chavesParaModal, () => {}, 'chaves')} 
              disabled={!pessoaSelecionada || isChavesLoading}
              style={[styles.button, (!pessoaSelecionada || isChavesLoading) && styles.buttonDisabled]}
            >
              <Text style={styles.placeholderText}>
                {isChavesLoading ? 'Carregando...' : `${chavesSelecionadas.length} chaves selecionadas`}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        <TouchableOpacity onPress={registrarEmprestimo} style={styles.confirmButton}>
          <Check size={20} color="#fff" />
          <Text style={styles.confirmButtonText}>Confirmar Empréstimo</Text>
        </TouchableOpacity>
      </View>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalConfig.title}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Search size={20} color="#9ca3af" />
                <TextInput style={styles.searchInput} placeholder="Pesquisar..." value={searchTerm} onChangeText={setSearchTerm}/>
              </View>
              <FlatList
                data={filteredItems}
                keyExtractor={(item, index) => item.id ? item.id.toString() : `item-${index}`}
                renderItem={({ item }) => {
                  const isSelected = modalConfig.type === 'chaves' && chavesSelecionadas.some(c => c.id === item.id);
                  return (
                    <TouchableOpacity 
                      style={styles.modalItem} 
                      onPress={() => {
                        if (modalConfig.type === 'chaves') {
                          handleToggleChave(item);
                        } else {
                          modalConfig.onSelect(item);
                          setModalVisible(false);
                        }
                      }}
                    >
                      {modalConfig.type === 'chaves' && (isSelected ? <CheckSquare size={24} color="#2563eb" /> : <Square size={24} color="#6b7280" />)}
                      <View style={styles.modalItemInfo}>
                         <Text style={styles.modalItemText}>{item.nome || item.nome_completo || item.codigo_chave}</Text>
                         {item.local_nome && <Text style={styles.modalItemSubtext}>{item.local_nome}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainContainer: { flex: 1, justifyContent: 'space-between', padding: 24 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  selectionContainer: { marginBottom: 24 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
  button: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, height: 56, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16 },
  buttonDisabled: { backgroundColor: '#e5e7eb' },
  buttonText: { color: '#1f2937', fontSize: 16 },
  placeholderText: { color: '#6b7280', fontSize: 16 },
  confirmButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  confirmButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  cardPessoa: { backgroundColor: '#e0f2fe', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#bae6fd' },
  cardPessoaImage: { width: 64, height: 64, borderRadius: 32, marginRight: 12, backgroundColor: '#f0f9ff' },
  cardPessoaName: { fontSize: 18, fontWeight: 'bold', color: '#0c4a6e' },
  cardPessoaMatricula: { fontSize: 14, color: '#0369a1', marginTop: 4 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, width: '90%', maxHeight: '70%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: '#1f2937', marginLeft: 8 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalItemInfo: { flex: 1, marginLeft: 12 },
  modalItemText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  modalItemSubtext: { fontSize: 14, color: '#6b7280', marginTop: 2 },
});

