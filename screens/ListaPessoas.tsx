import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Image, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Search, Edit } from 'lucide-react-native';

export const ListaPessoas = ({ navigation }) => {
  const [pessoas, setPessoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const pessoasData = JSON.parse(await AsyncStorage.getItem('pessoas') || '[]');
      setPessoas(pessoasData.sort((a, b) => a.nome.localeCompare(b.nome)));
    });
    return unsubscribe;
  }, [navigation]);

  // Lógica de filtragem atualizada para incluir telefone
  const filteredPessoas = useMemo(() => {
    if (!searchTerm) {
      return pessoas;
    }
    
    const lowerCaseTerm = searchTerm.toLowerCase();
    
    return pessoas.filter(p => {
      const nomeLower = p.nome.toLowerCase();
      const documentoLower = p.documento ? p.documento.toLowerCase() : '';
      // 1. Adiciona o telefone à lógica de busca
      const telefoneLower = p.telefone ? p.telefone.toLowerCase() : '';
      
      return nomeLower.includes(lowerCaseTerm) || 
             documentoLower.includes(lowerCaseTerm) ||
             telefoneLower.includes(lowerCaseTerm);
    });
  }, [searchTerm, pessoas]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.foto }} style={styles.foto} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardSubtitle}>{item.perfil} • DOC: {item.documento}</Text>
        {/* 2. Exibe o telefone se ele existir */}
        {item.telefone ? <Text style={styles.cardPhone}>Tel: {item.telefone}</Text> : null}
        {!item.ativo && <Text style={styles.inactiveText}>(INATIVO)</Text>}
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Editar Pessoa', { pessoaId: item.id })} style={styles.editButton}>
        <Edit size={24} color="#3b82f6" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>Pessoas Cadastradas</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            // 3. Atualiza o placeholder da busca
            placeholder="Pesquisar por nome, doc ou telefone..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <FlatList
          data={filteredPessoas}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma pessoa encontrada.</Text>}
        />
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Nova Pessoa')}>
          <User size={24} color="#fff" />
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
    foto: { width: 60, height: 60, borderRadius: 30, marginRight: 12, },
    cardInfo: { flex: 1, },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    cardSubtitle: { fontSize: 14, color: '#6b7280' },
    // 4. Estilo para o texto do telefone
    cardPhone: { fontSize: 14, color: '#374151', marginTop: 4 },
    inactiveText: { fontSize: 12, color: '#ef4444', fontWeight: 'bold', marginTop: 4, },
    editButton: { padding: 8, },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 8, },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6b7280' },
});
