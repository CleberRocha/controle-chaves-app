import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, RefreshControl, Alert, TextInput, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PlusCircle, AlertTriangle, Search, Calendar, XCircle } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getOcorrencias } from '../services/apiService';

// O Card agora é um botão que navega para os detalhes
const OcorrenciaCard = ({ item, onPress }) => {
    const formattedDate = new Date(item.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = new Date(item.data_hora).toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' });

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.local?.nome || 'Local não informado'}</Text>
                <Text style={styles.cardDate}>{`${formattedDate} às ${formattedTime}`}</Text>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>{item.descricao}</Text>
            <Text style={styles.cardResponsible}>Registrado por: {item.responsavel_registro}</Text>
        </TouchableOpacity>
    );
};

export const ListaOcorrencias = () => {
  const navigation = useNavigation();
  const [allOcorrencias, setAllOcorrencias] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para o filtro de data
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' ou 'end'

  const fetchOcorrencias = async () => {
    // ... (função fetchOcorrencias permanece a mesma)
    try {
      const response = await getOcorrencias();
      if (!response.ok) throw new Error('Falha ao buscar ocorrências.');
      const data = await response.json();
      const formattedData = data.map(o => ({
        ...o,
        local: o.local_id ? { id: o.local_id, nome: o.local_nome } : null,
      }));
      setAllOcorrencias(formattedData);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de ocorrências.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchOcorrencias();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOcorrencias();
  };
  
  // Funções para controlar o seletor de data
  const showDatePicker = (mode) => {
    setDatePickerMode(mode);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date) => {
    if (datePickerMode === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    hideDatePicker();
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
  };

  // Filtra as ocorrências com base na busca e na data
  const filteredOcorrencias = useMemo(() => {
    let filtered = allOcorrencias;

    // Filtro por texto
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
            item.descricao.toLowerCase().includes(lowercasedQuery) ||
            (item.responsavel_registro || '').toLowerCase().includes(lowercasedQuery) ||
            (item.local?.nome || '').toLowerCase().includes(lowercasedQuery)
        );
    }

    // Filtro por data de início
    if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        filtered = filtered.filter(item => new Date(item.data_hora) >= startOfDay);
    }

    // Filtro por data de fim
    if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.data_hora) <= endOfDay);
    }

    return filtered;
  }, [allOcorrencias, searchQuery, startDate, endDate]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Ocorrências</Text>
            <View style={styles.searchContainer}>
                <Search size={20} color="#6b7280" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por local, responsável..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#888"
                />
            </View>
            <View style={styles.filtersContainer}>
                <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('start')}>
                    <Calendar size={18} color="#4b5563" />
                    <Text style={styles.dateButtonText}>{startDate ? startDate.toLocaleDateString('pt-BR') : 'Data Início'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('end')}>
                    <Calendar size={18} color="#4b5563" />
                    <Text style={styles.dateButtonText}>{endDate ? endDate.toLocaleDateString('pt-BR') : 'Data Fim'}</Text>
                </TouchableOpacity>
                 {(searchQuery || startDate || endDate) && (
                    <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                        <XCircle size={18} color="#ef4444" />
                        <Text style={styles.clearButtonText}>Limpar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
            locale="pt_BR"
        />

        <FlatList
            data={filteredOcorrencias}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <OcorrenciaCard 
                    item={item} 
                    onPress={() => navigation.navigate('Detalhe da Ocorrência', { ocorrencia: item })}
                />
            )}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#2563eb"]} />}
            ListEmptyComponent={
                <View style={styles.centered}>
                    <AlertTriangle size={48} color="#6b7280" />
                    <Text style={styles.emptyText}>Nenhuma ocorrência encontrada.</Text>
                </View>
            }
        />
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Nova Ocorrência')} activeOpacity={0.8}>
            <PlusCircle size={24} color="#fff" />
            <Text style={styles.fabText}>Nova Ocorrência</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const cardShadow = { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1f2937' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginTop: 16 },
  searchInput: { flex: 1, height: 50, marginLeft: 8, fontSize: 16 },
  filtersContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, marginRight: 8 },
  dateButtonText: { marginLeft: 8, color: '#4b5563' },
  clearButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  clearButtonText: { marginLeft: 8, color: '#ef4444', fontWeight: 'bold' },
  listContainer: { padding: 16, paddingBottom: 80 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, ...cardShadow },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1, marginRight: 8 },
  cardDate: { fontSize: 12, color: '#6b7280' },
  cardDescription: { fontSize: 14, color: '#374151', marginBottom: 12 },
  cardResponsible: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, ...cardShadow },
  fabText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});

