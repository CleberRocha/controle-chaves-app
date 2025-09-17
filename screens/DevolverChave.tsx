import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { KeyRound, User, Calendar, Check, Search, MapPin, X, ChevronDown } from 'lucide-react-native';
import { getChaves, getLocais, devolverChave } from '../services/apiService';
import { useFocusEffect } from '@react-navigation/native';

// Botão de seleção reutilizado
const SelectionButton = ({ label, value, placeholder, onPress }) => (
  <View style={styles.selectionContainer}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={value ? styles.buttonText : styles.placeholderText}>{value || placeholder}</Text>
      <ChevronDown size={20} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

export const DevolverChave = () => {
  const [emprestimosPendentes, setEmprestimosPendentes] = useState([]);
  const [todosLocais, setTodosLocais] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [localFiltro, setLocalFiltro] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        setIsLoading(true);
        try {
          const [chavesRes, locaisRes] = await Promise.all([getChaves(), getLocais()]);
          if (!chavesRes.ok || !locaisRes.ok) {
            throw new Error("Não foi possível carregar os dados do servidor.");
          }
          const chavesData = await chavesRes.json();
          const locaisData = await locaisRes.json();
          setEmprestimosPendentes(chavesData.filter(c => c.status === 'em_uso'));
          setTodosLocais(locaisData);
        } catch (e) {
          Alert.alert("Erro", e.message || "Não foi possível carregar os dados.");
        } finally {
          setIsLoading(false);
        }
      };
      carregarDados();
    }, [])
  );

  const handleDevolverChave = (chaveId) => {
    Alert.alert(
      "Confirmar Devolução",
      "Tem certeza que deseja devolver esta chave?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              const response = await devolverChave(chaveId);
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao devolver a chave.');
              }
              Alert.alert('Sucesso', 'Chave devolvida com sucesso!');
              // Recarrega os dados para atualizar a lista
              const chavesRes = await getChaves();
              const chavesData = await chavesRes.json();
              setEmprestimosPendentes(chavesData.filter(c => c.status === 'em_uso'));
            } catch (e) {
              Alert.alert('Erro', e.message);
            }
          }
        }
      ]
    );
  };

  const filteredEmprestimos = useMemo(() => {
    let emprestimos = emprestimosPendentes;

    if (localFiltro) {
      emprestimos = emprestimos.filter(e => e.local_id === localFiltro.id);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      emprestimos = emprestimos.filter(emprestimo =>
        emprestimo.codigo_chave.toLowerCase().includes(term) ||
        (emprestimo.pessoa_nome_em_posse && emprestimo.pessoa_nome_em_posse.toLowerCase().includes(term))
      );
    }
    
    return emprestimos;
  }, [searchTerm, emprestimosPendentes, localFiltro]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <KeyRound size={24} color="#1d4ed8" />
        </View>
        <Text style={styles.cardTitle}>{item.codigo_chave}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <User size={16} color="#6b7280" style={styles.infoIcon} />
          <Text style={styles.infoText}>Com: {item.pessoa_nome_em_posse || 'Pessoa desconhecida'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#6b7280" style={styles.infoIcon} />
          <Text style={styles.infoDate}>
            Retirada em: {new Date(item.data_retirada).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDevolverChave(item.id)} style={styles.confirmButton}>
        <Check size={20} color="#fff" style={styles.infoIcon} />
        <Text style={styles.confirmButtonText}>Confirmar Devolução</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>Devolver Chave</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por chave ou pessoa..."
            placeholderTextColor="#888"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <SelectionButton
          label="Filtrar por Local"
          value={localFiltro?.nome}
          placeholder="Todos os locais"
          onPress={() => setModalVisible(true)}
        />
        
        {isLoading ? <ActivityIndicator size="large" color="#2563eb" /> : (
          <FlatList
            data={filteredEmprestimos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma chave para devolver.</Text>
                <Text style={styles.emptySubText}>Tudo certo por aqui!</Text>
              </View>
            }
          />
        )}
      </View>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtrar por Local</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
              </View>
              <FlatList
                data={[{ id: null, nome: 'Todos os locais' }, ...todosLocais]}
                keyExtractor={(item, index) => item.id ? item.id.toString() : `item-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalItem} 
                    onPress={() => {
                      setLocalFiltro(item.id ? item : null);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.nome}</Text>
                  </TouchableOpacity>
                )}
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
  mainContainer: { flex: 1, padding: 24 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#1f2937' },
  selectionContainer: { marginBottom: 24 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
  button: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, height: 56, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16 },
  buttonText: { color: '#1f2937', fontSize: 16 },
  placeholderText: { color: '#9ca3af', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#6b7280', textAlign: 'center' },
  emptySubText: { color: '#9ca3af' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, },
  iconContainer: { backgroundColor: '#dbeafe', padding: 12, borderRadius: 999, marginRight: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16, },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { marginRight: 8 },
  infoText: { color: '#4b5563', fontSize: 16 },
  infoDate: { color: '#6b7280', fontSize: 14 },
  confirmButton: { backgroundColor: '#16a3a4', marginTop: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalItemText: { fontSize: 18, color: '#1f2937' },
});

