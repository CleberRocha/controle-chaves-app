import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, Alert, TouchableOpacity, FlatList, TouchableWithoutFeedback } from 'react-native';
import { KeyRound, User, Calendar, CheckCircle, Lock, X, ChevronDown } from 'lucide-react-native';
import { getChaves, getLocais } from '../services/apiService';
import { useFocusEffect } from '@react-navigation/native';

// Card de estatística reutilizável
const StatCard = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    {React.cloneElement(icon, { color: color, size: 28 })}
    <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

// Botão de seleção reutilizável
const SelectionButton = ({ label, value, placeholder, onPress }) => (
    <View style={styles.selectionContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.button}>
        <Text style={value ? styles.buttonText : styles.placeholderText}>{value || placeholder}</Text>
        <ChevronDown size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );

export const Relatorio = () => {
  const [chaves, setChaves] = useState([]);
  const [todosLocais, setTodosLocais] = useState([]);
  const [localFiltro, setLocalFiltro] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        setIsLoading(true);
        try {
          const [chavesRes, locaisRes] = await Promise.all([getChaves(), getLocais()]);
          if (!chavesRes.ok || !locaisRes.ok) {
            throw new Error('Não foi possível carregar os dados do relatório.');
          }
          const chavesData = await chavesRes.json();
          const locaisData = await locaisRes.json();
          setChaves(chavesData);
          setTodosLocais(locaisData);
        } catch(e) {
          Alert.alert("Erro", e.message || "Ocorreu um erro desconhecido.");
        } finally {
          setIsLoading(false);
        }
      };
      carregarDados();
    }, [])
  );

  const chavesFiltradas = useMemo(() => {
    if (!localFiltro) {
        return chaves;
    }
    return chaves.filter(c => c.local_id === localFiltro.id);
  }, [chaves, localFiltro]);

  const emprestimosAtivos = chavesFiltradas.filter((c) => c.status === 'em_uso');
  const chavesDisponiveis = chavesFiltradas.filter((c) => c.status === 'disponivel');

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Relatórios</Text>

        <SelectionButton
          label="Filtrar por Local"
          value={localFiltro?.nome}
          placeholder="Todos os locais"
          onPress={() => setModalVisible(true)}
        />

        <View style={styles.dashboardContainer}>
          <StatCard 
            title="Disponíveis" 
            value={chavesDisponiveis.length} 
            icon={<CheckCircle />}
            color="#16a34a"
          />
          <StatCard 
            title="Emprestadas" 
            value={emprestimosAtivos.length} 
            icon={<Lock />}
            color="#dc2626"
          />
        </View>

        <Text style={styles.sectionTitle}>Chaves Emprestadas Atualmente</Text>
        {emprestimosAtivos.length === 0 ? (
          <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma chave emprestada {localFiltro ? `em "${localFiltro.nome}"` : 'no momento'}.</Text>
          </View>
        ) : (
          emprestimosAtivos.map((chave) => (
            <View key={chave.id} style={styles.loanCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <KeyRound size={24} color="#dc2626" />
                </View>
                <Text style={styles.cardTitle}>{chave.codigo_chave}</Text>
              </View>
              <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                      <User size={16} color="#6b7280" style={styles.infoIcon} />
                      <Text style={styles.infoText}>Com: {chave.pessoa_nome_em_posse || 'Desconhecido'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                      <Calendar size={16} color="#6b7280" style={styles.infoIcon} />
                      <Text style={styles.infoDate}>
                          Desde: {new Date(chave.data_retirada).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                  </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

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

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { padding: 24, },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, },
  selectionContainer: { marginBottom: 24 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
  button: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, height: 56, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16 },
  buttonText: { color: '#1f2937', fontSize: 16 },
  placeholderText: { color: '#9ca3af', fontSize: 16 },
  dashboardContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32, },
  statCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', flex: 1, marginHorizontal: 8, ...cardShadow, },
  statValue: { fontSize: 30, fontWeight: 'bold', marginTop: 8, },
  statTitle: { color: '#4b5563', fontWeight: '500', },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, },
  emptyCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', ...cardShadow, },
  emptyText: { color: '#6b7280', },
  loanCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, ...cardShadow, },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, },
  iconContainer: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 999, marginRight: 16, },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', flex: 1, },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f9fafb', paddingTop: 12, },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, },
  infoIcon: { marginRight: 8, },
  infoText: { color: '#4b5563', },
  infoDate: { color: '#6b7280', fontSize: 14, },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalItemText: { fontSize: 18, color: '#1f2937' },
});

