// screens/Relatorio.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyRound, User, Calendar, CheckCircle, Lock } from 'lucide-react-native';

const StatCard = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    {React.cloneElement(icon, { color: color, size: 28 })}
    <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

export const Relatorio = ({ navigation }) => {
  const [emprestimos, setEmprestimos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [chaves, setChaves] = useState([]);

  useEffect(() => {
    const carregarRelatorio = async () => {
      try {
        const chavesData = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
        const pessoasData = JSON.parse(await AsyncStorage.getItem('pessoas') || '[]');
        const emprestimosData = JSON.parse(await AsyncStorage.getItem('emprestimos') || '[]');
        setChaves(chavesData);
        setPessoas(pessoasData);
        setEmprestimos(emprestimosData);
      } catch(e) {
        console.error("Erro ao carregar relatórios", e);
      }
    };

    const unsubscribe = navigation.addListener('focus', carregarRelatorio);
    return unsubscribe;
  }, [navigation]);

  const emprestimosAtivos = emprestimos.filter((e) => !e.devolvido);
  const chavesEmprestadasIds = emprestimosAtivos.map((e) => e.chaveId);
  const chavesDisponiveis = chaves.filter((c) => !chavesEmprestadasIds.includes(c.id));

  const nomePessoa = (id) => {
    const p = pessoas.find((p) => p.id === id);
    if (!p) return 'Desconhecido';
    // Adiciona um indicador se a pessoa estiver inativa
    return p.ativo === false ? `${p.nome} (Inativo)` : p.nome;
  };
  
  const nomeChave = (id) => {
    const c = chaves.find((c) => c.id === id);
    if (!c) return 'Desconhecida';
    // Adiciona um indicador se a chave estiver inativa
    return c.ativo === false ? `${c.nome} (Inativa)` : c.nome;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Relatórios</Text>

        {/* Dashboard Visual */}
        <View style={styles.dashboardContainer}>
          <StatCard 
            title="Disponíveis" 
            value={chavesDisponiveis.length} 
            icon={<CheckCircle />}
            color="#16a34a" // green-600
          />
          <StatCard 
            title="Emprestadas" 
            value={emprestimosAtivos.length} 
            icon={<Lock />}
            color="#dc2626" // red-600
          />
        </View>

        {/* Lista de Chaves Emprestadas */}
        <Text style={styles.sectionTitle}>Chaves Emprestadas Atualmente</Text>
        {emprestimosAtivos.length === 0 ? (
          <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma chave emprestada no momento.</Text>
          </View>
        ) : (
          emprestimosAtivos.map((e) => (
            <View key={e.id} style={styles.loanCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <KeyRound size={24} color="#dc2626" />
                </View>
                <Text style={styles.cardTitle}>{nomeChave(e.chaveId)}</Text>
              </View>
              <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                      <User size={16} color="#6b7280" style={styles.infoIcon} />
                      <Text style={styles.infoText}>Com: {nomePessoa(e.pessoaId)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                      <Calendar size={16} color="#6b7280" style={styles.infoIcon} />
                      <Text style={styles.infoDate}>
                          Desde: {new Date(e.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                  </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  container: {
    padding: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  dashboardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    ...cardShadow,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statTitle: {
    color: '#4b5563',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    backgroundColor: '#fee2e2', // bg-red-100
    padding: 12,
    borderRadius: 999,
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
    borderTopColor: '#f9fafb', // border-gray-50
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
});