// screens/NovoEmprestimo.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronDown, Check, X, Search, User } from 'lucide-react-native';

const SelectionButton = ({ label, value, placeholder, onPress, enabled }) => (
  <View style={styles.selectionButtonContainer}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity onPress={onPress} disabled={!enabled} style={[styles.button, !enabled && styles.buttonDisabled]}>
      <Text style={value ? styles.buttonText : styles.placeholderText}>{value || placeholder}</Text>
      <ChevronDown size={20} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

export const NovoEmprestimo = ({ navigation }) => {
  const [pessoas, setPessoas] = useState([]);
  const [chaves, setChaves] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
  const [chaveSelecionada, setChaveSelecionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', items: [], onSelect: () => {} });
  const [searchTerm, setSearchTerm] = useState('');

  // Efeito para carregar os dados iniciais do AsyncStorage
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const pessoasData = JSON.parse(await AsyncStorage.getItem('pessoas') || '[]');
        const chavesData = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
        const emprestimosData = JSON.parse(await AsyncStorage.getItem('emprestimos') || '[]');
        setPessoas(pessoasData.filter(p => p.ativo !== false));
        setChaves(chavesData.filter(c => c.ativo !== false));
        setEmprestimos(emprestimosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      }
    };
    const unsubscribe = navigation.addListener('focus', carregarDados);
    return unsubscribe;
  }, [navigation]);

  // Filtra os itens do modal com base no termo de busca
  const filteredItems = modalConfig.items.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
    const nomeLower = item.nome?.toLowerCase() || '';
    const documentoLower = item.documento?.toLowerCase() || '';
    return nomeLower.includes(searchTermLower) || documentoLower.includes(searchTermLower);
  });

  // Abre o modal de seleção
  const openModal = (title, items, onSelect) => {
    setModalConfig({ title, items, onSelect });
    setSearchTerm('');
    setModalVisible(true);
  };

  // Funções para lidar com a seleção de itens no modal
  const handleSelectPessoa = (pessoa) => {
    setPessoaSelecionada(pessoa);
    setChaveSelecionada(null); // Limpa a chave selecionada ao trocar de pessoa
    setModalVisible(false);
  };

  const handleSelectChave = (chave) => {
    setChaveSelecionada(chave);
    setModalVisible(false);
  };

  // Filtra as chaves com base na permissão do usuário selecionado
  const abrirModalDeChaves = () => {
    if (!pessoaSelecionada) {
      Alert.alert("Atenção", "Por favor, selecione uma pessoa primeiro.");
      return;
    }

    const chavesEmprestadasIds = emprestimos.filter(e => !e.devolvido).map(e => e.chaveId);
    const chavesNaoEmprestadas = chaves.filter(c => !chavesEmprestadasIds.includes(c.id));

    const chavesPermitidas = chavesNaoEmprestadas.filter(chave => {
      // Para retrocompatibilidade: se a chave não tem perfis, ela é permitida.
      if (!chave.perfisPermitidos || chave.perfisPermitidos.length === 0) {
        return true;
      }
      // Verifica se o perfil da pessoa está na lista de perfis permitidos da chave
      return chave.perfisPermitidos.includes(pessoaSelecionada.perfil);
    });

    openModal("Selecione a Chave", chavesPermitidas, handleSelectChave);
  };

  // Registra o empréstimo no AsyncStorage
  const registrarEmprestimo = async () => {
    if (!pessoaSelecionada || !chaveSelecionada) {
      Alert.alert('Atenção', 'É necessário selecionar uma pessoa e uma chave.');
      return;
    }

    const novo = {
      id: Date.now().toString(),
      pessoaId: pessoaSelecionada.id,
      chaveId: chaveSelecionada.id,
      data: new Date().toISOString(),
      devolvido: false,
    };

    const emprestimosAtuais = JSON.parse(await AsyncStorage.getItem('emprestimos') || '[]');
    await AsyncStorage.setItem('emprestimos', JSON.stringify([...emprestimosAtuais, novo]));

    Alert.alert('Sucesso', 'Empréstimo registrado com sucesso!');
    navigation.goBack();
  };

  // Renderiza cada item na lista do modal
  const renderModalItem = ({ item }) => {
    const isPessoa = 'foto' in item;

    if (isPessoa) {
      return (
        <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectPessoa(item)}>
          {item.foto ? (
            <Image source={{ uri: item.foto }} style={styles.modalItemImage} />
          ) : (
            <View style={styles.modalItemImagePlaceholder}>
              <User size={24} color="#6b7280" />
            </View>
          )}
          <View>
            <Text style={styles.modalItemText}>{item.nome}</Text>
            <Text style={styles.modalItemSubtext}>{item.documento}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Renderização para chaves
    return (
      <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectChave(item)}>
        <Text style={styles.modalItemText}>{item.nome}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View>
          <Text style={styles.headerTitle}>Novo Empréstimo</Text>
          
          <SelectionButton
            label="Para quem é o empréstimo?"
            value={pessoaSelecionada?.nome}
            placeholder={pessoas.length > 0 ? "Selecione uma pessoa" : "Nenhum cadastro encontrado"}
            enabled={pessoas.length > 0}
            onPress={() => openModal("Selecione a Pessoa", pessoas, handleSelectPessoa)}
          />

          {pessoaSelecionada && (
            <View style={styles.confirmationCard}>
              <Image source={{ uri: pessoaSelecionada.foto }} style={styles.confirmationImage} />
              <View style={styles.confirmationTextContainer}>
                <Text style={styles.confirmationName}>{pessoaSelecionada.nome}</Text>
                <Text style={styles.confirmationDoc}>DOC: {pessoaSelecionada.documento}</Text>
                <Text style={styles.confirmationProfile}>PERFIL: {pessoaSelecionada.perfil}</Text>
              </View>
            </View>
          )}

          <SelectionButton
            label="Qual chave será emprestada?"
            value={chaveSelecionada?.nome}
            placeholder={pessoaSelecionada ? "Selecione uma chave" : "Selecione uma pessoa primeiro"}
            enabled={!!pessoaSelecionada}
            onPress={abrirModalDeChaves}
          />
        </View>
        <TouchableOpacity onPress={registrarEmprestimo} style={styles.confirmButton}>
          <Check size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.confirmButtonText}>Confirmar Empréstimo</Text>
        </TouchableOpacity>
      </View>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{modalConfig.title}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <X size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar por nome ou documento..."
                    placeholderTextColor="#9ca3af"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </View>

                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderModalItem}
                  ListEmptyComponent={
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>Nenhum item encontrado.</Text>
                    </View>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  mainContainer: { flex: 1, justifyContent: 'space-between', padding: 24 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  selectionButtonContainer: { marginBottom: 24 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
  button: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, height: 56, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16 },
  buttonDisabled: { backgroundColor: '#e5e7eb' },
  buttonText: { color: '#1f2937', fontSize: 16 },
  placeholderText: { color: '#9ca3af', fontSize: 16 },
  confirmButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  confirmButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  confirmationCard: { backgroundColor: '#e0f2fe', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#bae6fd' },
  confirmationImage: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  confirmationTextContainer: { flex: 1 },
  confirmationName: { fontSize: 18, fontWeight: 'bold', color: '#0c4a6e' },
  confirmationDoc: { fontSize: 14, color: '#0369a1', marginTop: 4 },
  confirmationProfile: { fontSize: 14, color: '#0369a1', marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, margin: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: '#1f2937' },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalItemImage: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#e5e7eb' },
  modalItemImagePlaceholder: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  modalItemText: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  modalItemSubtext: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  emptyListContainer: { padding: 24, alignItems: 'center' },
  emptyListText: { fontSize: 16, color: '#6b7280' },
});