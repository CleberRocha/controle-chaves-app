import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Image, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { User, Search, Edit } from 'lucide-react-native';
import { getPessoas, API_URL } from '../services/apiService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export const ListaPessoas = () => {
  const navigation = useNavigation();
  const [pessoas, setPessoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // CORREÇÃO APLICADA AQUI
  // O `useFocusEffect` agora segue o padrão recomendado, com a função
  // assíncrona definida e chamada dentro do `useCallback`.
  useFocusEffect(
    useCallback(() => {
      const fetchPessoas = async () => {
        // Para a primeira carga, mostramos o indicador de loading.
        // Nas recargas de foco subsequentes, a atualização é em segundo plano.
        if (pessoas.length === 0) {
            setIsLoading(true);
        }
        try {
          const response = await getPessoas(); // Busca todos os dados
          if (!response.ok) throw new Error('Falha ao buscar pessoas.');
          const data = await response.json();
          setPessoas(data);
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar as pessoas.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPessoas();
    }, []) // O array de dependências vazio garante que a busca seja refeita sempre que a tela ganhar foco.
  );

  // A filtragem por texto e pelo switch de inativos é feita no lado do cliente
  const pessoasFiltradas = useMemo(() => {
    let listaBase = mostrarInativos ? pessoas : pessoas.filter(p => p.ativo);
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        listaBase = listaBase.filter(p => 
            p.nome_completo.toLowerCase().includes(term) ||
            p.identificador_funcional.toLowerCase().includes(term) ||
            p.documento.toLowerCase().includes(term)
        );
    }
    return listaBase.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
  }, [pessoas, mostrarInativos, searchTerm]);

  const renderItem = ({ item }) => {
    const correctedPath = item.foto_url ? item.foto_url.replace(/\\/g, '/') : null;
    const imageUrl = correctedPath ? `${API_URL}/${correctedPath}` : 'https://placehold.co/128x128/e2e8f0/64748b?text=Foto';

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.foto} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.nome_completo}</Text>
          <Text style={styles.cardSubtitle}>
            Matrícula: {item.identificador_funcional}
          </Text>
          {item.ativo === false && <Text style={styles.inactiveText}>(INATIVO)</Text>}
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Editar Pessoa', { pessoaId: item.id })} 
          style={styles.editButton}
        >
          <Edit size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>Pessoas Cadastradas</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por nome, doc ou matrícula..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Mostrar inativos</Text>
            <Switch
                trackColor={{ false: "#d1d5db", true: "#a5b4fc" }}
                thumbColor={mostrarInativos ? "#4f46e5" : "#f4f3f4"}
                onValueChange={setMostrarInativos}
                value={mostrarInativos}
            />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={pessoasFiltradas}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma pessoa encontrada.</Text>}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
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
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb', },
    searchInput: { flex: 1, height: 48, fontSize: 16, color: '#1f2937', marginLeft: 8, },
    filterContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
    filterLabel: { marginRight: 8, fontSize: 16, color: '#4b5563' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    foto: { width: 60, height: 60, borderRadius: 30, marginRight: 12, backgroundColor: '#e2e8f0' },
    cardInfo: { flex: 1, },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    cardSubtitle: { fontSize: 14, color: '#6b7280' },
    inactiveText: { fontSize: 12, color: '#ef4444', fontWeight: 'bold', marginTop: 4, },
    editButton: { padding: 8, },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 8, },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6b7280' },
});

