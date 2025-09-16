import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Key, Search, Edit, Plus, Lock } from 'lucide-react-native';
import { getChaves } from '../services/apiService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ListaChaves = () => {
  const navigation = useNavigation();
  const [chaves, setChaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userGroup, setUserGroup] = useState(null);

  // O useFocusEffect está com um erro de sintaxe, vamos corrigir.
  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const operadorString = await AsyncStorage.getItem('operador');
            if (operadorString) {
                setUserGroup(JSON.parse(operadorString).grupo);
            }
            
            const response = await getChaves(searchTerm);
            if (!response.ok) throw new Error('Falha ao buscar chaves.');
            const data = await response.json();
            setChaves(data);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
        } finally {
            setIsLoading(false);
        }
      };
      fetchInitialData();
    }, [searchTerm])
  );
  
  // CORREÇÃO 1: Permite que 'admin' e 'fiscal' editem
  const handleEditPress = (chaveId) => {
    if (userGroup === 'admin' || userGroup === 'fiscal') {
      navigation.navigate('Editar Chave', { chaveId: chaveId });
    } else {
      Alert.alert('Acesso Negado', 'Você não tem permissão para editar chaves.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.statusIndicator, { backgroundColor: item.status === 'disponivel' ? '#22c55e' : '#ef4444' }]} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.codigo_chave}</Text>
        <Text style={styles.cardSubtitle}>{item.local_nome}</Text>
        <Text style={[styles.statusText, { color: item.status === 'disponivel' ? '#22c55e' : '#ef4444' }]}>
          {item.status === 'disponivel' ? 'Disponível' : `Em posse de: ${item.pessoa_nome_em_posse || 'Desconhecido'}`}
        </Text>
      </View>
      
      {/* CORREÇÃO 2: Permite que 'admin' e 'fiscal' vejam o botão de edição */}
      {(userGroup === 'admin' || userGroup === 'fiscal') ? (
        <TouchableOpacity onPress={() => handleEditPress(item.id)} style={styles.editButton}>
            <Edit size={24} color="#3b82f6" />
        </TouchableOpacity>
      ) : (
        <View style={styles.editButton}>
            <Lock size={24} color="#9ca3af" />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>Chaves Cadastradas</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por código ou local..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={chaves}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma chave encontrada.</Text>}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
        {/* CORREÇÃO 3: Permite que 'admin' e 'fiscal' vejam o botão de adicionar */}
        {(userGroup === 'admin' || userGroup === 'fiscal') && (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Nova Chave')}>
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    mainContainer: { flex: 1, padding: 24 },
    headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 24, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    searchInput: { flex: 1, height: 48, fontSize: 16, color: '#1f2937', marginLeft: 8 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    statusIndicator: { width: 10, height: '80%', borderRadius: 5, marginRight: 16 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    cardSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    statusText: { fontSize: 14, fontWeight: 'bold', marginTop: 4, flexShrink: 1 },
    editButton: { padding: 8 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6b7280' },
});

