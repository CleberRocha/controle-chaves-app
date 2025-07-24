// screens/ListaChaves.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyRound, Search, Edit, Plus } from 'lucide-react-native';

export const ListaChaves = ({ navigation }) => {
  const [chaves, setChaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Carrega as chaves do AsyncStorage sempre que a tela entra em foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const chavesData = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
      // Ordena as chaves por nome para uma melhor visualização
      setChaves(chavesData.sort((a, b) => a.nome.localeCompare(b.nome)));
    });
    return unsubscribe;
  }, [navigation]);

  // Filtra as chaves com base no termo de busca
  const filteredChaves = useMemo(() => {
    if (!searchTerm) return chaves;
    return chaves.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, chaves]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <KeyRound size={24} color="#1d4ed8" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.descricao || 'Sem descrição'}</Text>
        {item.ativo === false && <Text style={styles.inactiveText}>(INATIVA)</Text>}
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Editar Chave', { chaveId: item.id })} style={styles.editButton}>
        <Edit size={24} color="#3b82f6" />
      </TouchableOpacity>
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
            placeholder="Pesquisar chave..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <FlatList
          data={filteredChaves}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma chave encontrada.</Text>}
          contentContainerStyle={{ paddingBottom: 80 }} // Espaço para o botão FAB
        />
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Nova Chave')}>
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    mainContainer: { flex: 1, padding: 24, },
    headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 24, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb', },
    searchInput: { flex: 1, height: 48, fontSize: 16, color: '#1f2937', marginLeft: 8, },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: { flex: 1, },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    cardSubtitle: { fontSize: 14, color: '#6b7280' },
    inactiveText: { fontSize: 12, color: '#ef4444', fontWeight: 'bold', marginTop: 4, },
    editButton: { padding: 8, },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowRadius: 4, shadowOpacity: 0.3, shadowOffset: { height: 2, width: 0 } },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6b7280' },
});