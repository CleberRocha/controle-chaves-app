// screens/DevolverChave.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyRound, User, Calendar, Check, Search } from 'lucide-react-native';

export const DevolverChave = ({ navigation }) => {
  const [emprestimosPendentes, setEmprestimosPendentes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [chaves, setChaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para a busca

  const carregarDados = async () => {
    try {
      const pessoasData = JSON.parse(await AsyncStorage.getItem('pessoas') || '[]');
      const chavesData = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
      const emprestimos = JSON.parse(await AsyncStorage.getItem('emprestimos') || '[]');
      const pendentes = emprestimos.filter((e) => !e.devolvido);
      
      setPessoas(pessoasData);
      setChaves(chavesData);
      setEmprestimosPendentes(pendentes);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', carregarDados);
    return unsubscribe;
  }, [navigation]);

  const devolverChave = async (id) => {
    const emprestimos = JSON.parse(await AsyncStorage.getItem('emprestimos') || '[]');
    const atualizados = emprestimos.map((e) =>
      e.id === id ? { ...e, devolvido: true, dataDevolucao: new Date().toISOString() } : e
    );
    await AsyncStorage.setItem('emprestimos', JSON.stringify(atualizados));
    Alert.alert('Sucesso', 'Chave devolvida com sucesso!');
    await carregarDados(); // Recarrega os dados para atualizar a lista
  };

  const nomePessoa = (id) => pessoas.find((p) => p.id === id)?.nome || 'Desconhecido';
  const nomeChave = (id) => chaves.find((c) => c.id === id)?.nome || 'Desconhecida';

  // Filtra a lista de empréstimos pendentes com base na busca
  const filteredEmprestimos = useMemo(() => {
    if (!searchTerm) {
      return emprestimosPendentes;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return emprestimosPendentes.filter(emprestimo =>
      nomeChave(emprestimo.chaveId).toLowerCase().includes(lowerCaseSearchTerm) ||
      nomePessoa(emprestimo.pessoaId).toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, emprestimosPendentes, pessoas, chaves]);

  const renderItem = ({ item }) => {
    const pessoa = pessoas.find((p) => p.id === item.pessoaId);
    const chave = chaves.find((c) => c.id === item.chaveId);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <KeyRound size={24} color="#1d4ed8" />
          </View>
          <Text style={styles.cardTitle}>{chave?.nome || 'Chave desconhecida'}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <User size={16} color="#6b7280" style={styles.infoIcon} />
            <Text style={styles.infoText}>Com: {pessoa?.nome || 'Pessoa desconhecida'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Calendar size={16} color="#6b7280" style={styles.infoIcon} />
            <Text style={styles.infoDate}>
              Retirada em: {new Date(item.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => devolverChave(item.id)}
          style={styles.confirmButton}
        >
          <Check size={20} color="#fff" style={styles.infoIcon} />
          <Text style={styles.confirmButtonText}>Confirmar Devolução</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>Devolver Chave</Text>

        {/* --- CAMPO DE PESQUISA --- */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por chave ou pessoa..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <FlatList
          data={filteredEmprestimos} // Usa a lista filtrada
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {emprestimosPendentes.length > 0 ? "Nenhum resultado encontrado." : "Nenhuma chave para devolver."}
              </Text>
              {emprestimosPendentes.length === 0 && <Text style={styles.emptySubText}>Tudo certo por aqui!</Text>}
            </View>
          }
        />
      </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  mainContainer: {
    flex: 1,
    padding: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 24,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    backgroundColor: '#dbeafe', // bg-blue-100
    padding: 12,
    borderRadius: 999, // rounded-full
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    color: '#4b5563',
  },
  infoDate: {
    color: '#6b7280',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#16a34a', // bg-green-600
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});