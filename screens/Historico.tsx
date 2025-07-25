// screens/Historico.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, SectionList, FlatList, StyleSheet, SafeAreaView, Alert, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyRound, User, Calendar, CheckCircle, Clock, Search, FileDown, XCircle } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePickerModal from "react-native-modal-datetime-picker";

// Função que gera o conteúdo HTML do relatório
const gerarConteudoHtml = (dados, modo, nomePessoaFn, nomeChaveFn) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  let corpoTabela = '';
  const tituloRelatorio = modo === 'porPessoa' ? 'Agrupado por Pessoa' : modo === 'porChave' ? 'Agrupado por Chave' : 'Ordem Cronológica';

  if (modo === 'recentes') {
    corpoTabela = dados.map(item => `
      <tr>
        <td>${nomeChaveFn(item.chaveId)}</td>
        <td>${nomePessoaFn(item.pessoaId)}</td>
        <td>${new Date(item.data).toLocaleString('pt-BR')}</td>
        <td>${item.devolvido && item.dataDevolucao ? new Date(item.dataDevolucao).toLocaleString('pt-BR') : 'Em andamento'}</td>
      </tr>
    `).join('');
  } else {
    dados.forEach(secao => {
      corpoTabela += `
        <tr>
          <td colspan="3" class="section-header">${secao.title}</td>
        </tr>
      `;
      secao.data.forEach(item => {
        corpoTabela += `
          <tr>
            <td>${modo === 'porPessoa' ? nomeChaveFn(item.chaveId) : nomePessoaFn(item.pessoaId)}</td>
            <td>${new Date(item.data).toLocaleString('pt-BR')}</td>
            <td>${item.devolvido && item.dataDevolucao ? `Devolvido em ${new Date(item.dataDevolucao).toLocaleString('pt-BR')}` : 'Em andamento'}</td>
          </tr>
        `;
      });
    });
  }
  
  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; }
          h1 { text-align: center; color: #1f2937; font-size: 20px; }
          h2 { text-align: center; color: #6b7280; font-size: 14px; font-weight: normal; margin-top: -10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .section-header { background-color: #e5e7eb; font-weight: bold; font-size: 12px; padding: 10px; }
        </style>
      </head>
      <body>
        <h1>Relatório de Histórico de Empréstimos</h1>
        <h2>Visão: ${tituloRelatorio} | Gerado em: ${dataAtual}</h2>
        <table>
          <thead>
            ${modo === 'recentes' ? `
              <tr>
                <th>Chave</th>
                <th>Pessoa</th>
                <th>Data de Retirada</th>
                <th>Data de Devolução</th>
              </tr>
            ` : `
              <tr>
                <th>${modo === 'porPessoa' ? 'Chave' : 'Pessoa'}</th>
                <th>Data de Retirada</th>
                <th>Status</th>
              </tr>
            `}
          </thead>
          <tbody>
            ${corpoTabela}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

export const Historico = ({ navigation }) => {
  const [historico, setHistorico] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [chaves, setChaves] = useState([]);
  const [viewMode, setViewMode] = useState('recentes');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');

  const carregarDados = async () => {
    try {
      const pessoasData = JSON.parse(await AsyncStorage.getItem('pessoas') || '[]');
      const chavesData = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
      const emprestimosData = JSON.parse(await AsyncStorage.getItem('emprestimos') || '[]');
      emprestimosData.sort((a, b) => new Date(b.data) - new Date(a.data));
      setPessoas(pessoasData);
      setChaves(chavesData);
      setHistorico(emprestimosData);
    } catch (e) { Alert.alert("Erro", "Não foi possível carregar o histórico."); }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', carregarDados);
    return unsubscribe;
  }, [navigation]);

  const nomePessoa = (id) => {
    const p = pessoas.find((p) => p.id === id);
    if (!p) return 'Desconhecido';
    return p.ativo === false ? `${p.nome} (Inativo)` : p.nome;
  };
  
  const nomeChave = (id) => {
    const c = chaves.find((c) => c.id === id);
    if (!c) return 'Desconhecida';
    return c.ativo === false ? `${c.nome} (Inativa)` : c.nome;
  };

  const processedData = useMemo(() => {
    const historicoFiltradoPorData = historico.filter(item => {
      const itemDate = new Date(item.data);
      if (startDate && itemDate < startDate.setHours(0, 0, 0, 0)) return false;
      if (endDate && itemDate > endDate.setHours(23, 59, 59, 999)) return false;
      return true;
    });

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const historicoFiltradoPorBusca = !lowerCaseSearchTerm ? historicoFiltradoPorData : historicoFiltradoPorData.filter(item => 
      nomePessoa(item.pessoaId).toLowerCase().includes(lowerCaseSearchTerm) ||
      nomeChave(item.chaveId).toLowerCase().includes(lowerCaseSearchTerm)
    );

    if (viewMode === 'recentes') {
      return historicoFiltradoPorBusca;
    }
    const grouped = historicoFiltradoPorBusca.reduce((acc, emprestimo) => {
      const key = viewMode === 'porPessoa' ? emprestimo.pessoaId : emprestimo.chaveId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(emprestimo);
      return acc;
    }, {});
    let sections = Object.keys(grouped).map(id => ({
      title: viewMode === 'porPessoa' ? nomePessoa(id) : nomeChave(id),
      data: grouped[id],
    })).sort((a, b) => a.title.localeCompare(b.title));
    
    return sections;
  }, [viewMode, historico, pessoas, chaves, searchTerm, startDate, endDate]);

  const handleExportPdf = async () => {
    const dataToExport = processedData || [];
    if (dataToExport.length === 0) {
      Alert.alert("Atenção", "Não há dados para exportar.");
      return;
    }
    try {
      const htmlContent = gerarConteudoHtml(dataToExport, viewMode, nomePessoa, nomeChave);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Relatório de Histórico' });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o arquivo PDF.");
    }
  };

  const renderGroupedItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {viewMode === 'porPessoa' ? nomeChave(item.chaveId) : nomePessoa(item.pessoaId)}
        </Text>
        <View style={[styles.statusBadge, item.devolvido ? styles.statusDevolvido : styles.statusEmprestado]}>
          <Text style={styles.statusText}>{item.devolvido ? "Devolvida" : "Em Andamento"}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}><Calendar size={16} color="#6b7280" style={styles.infoIcon} /><Text style={styles.infoDate}>Retirada: {new Date(item.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text></View>
        {item.devolvido && item.dataDevolucao && (<View style={styles.infoRow}><CheckCircle size={16} color="#16a34a" style={styles.infoIcon} /><Text style={styles.infoDate}>Devolução: {new Date(item.dataDevolucao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text></View>)}
      </View>
    </View>
  );

  const renderRecentItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <KeyRound size={20} color="#1f2937" style={styles.infoIcon} />
        <Text style={styles.cardTitle}>{nomeChave(item.chaveId)}</Text>
        <View style={[styles.statusBadge, item.devolvido ? styles.statusDevolvido : styles.statusEmprestado]}>
            <Text style={styles.statusText}>{item.devolvido ? "Devolvida" : "Em Andamento"}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}><User size={16} color="#6b7280" style={styles.infoIcon} /><Text style={styles.infoText}>Pessoa: {nomePessoa(item.pessoaId)}</Text></View>
        <View style={styles.infoRow}><Calendar size={16} color="#6b7280" style={styles.infoIcon} /><Text style={styles.infoDate}>Retirada: {new Date(item.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text></View>
        {item.devolvido && item.dataDevolucao && (<View style={styles.infoRow}><CheckCircle size={16} color="#16a34a" style={styles.infoIcon} /><Text style={styles.infoDate}>Devolução: {new Date(item.dataDevolucao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text></View>)}
      </View>
    </View>
  );

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
  
  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Histórico</Text>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPdf}>
            <FileDown size={20} color="#3b82f6" />
            <Text style={styles.exportButtonText}>Exportar</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewModeContainer}>
          <TouchableOpacity style={[styles.viewModeButton, viewMode === 'recentes' && styles.viewModeButtonActive]} onPress={() => setViewMode('recentes')}><Text style={[styles.viewModeText, viewMode === 'recentes' && styles.viewModeTextActive]}>Recentes</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.viewModeButton, viewMode === 'porPessoa' && styles.viewModeButtonActive]} onPress={() => setViewMode('porPessoa')}><Text style={[styles.viewModeText, viewMode === 'porPessoa' && styles.viewModeTextActive]}>Por Pessoa</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.viewModeButton, viewMode === 'porChave' && styles.viewModeButtonActive]} onPress={() => setViewMode('porChave')}><Text style={[styles.viewModeText, viewMode === 'porChave' && styles.viewModeTextActive]}>Por Chave</Text></TouchableOpacity>
        </View>

        <View style={styles.dateFilterContainer}>
          <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('start')}>
            <Calendar size={18} color={startDate ? "#1d4ed8" : "#4b5563"} />
            <Text style={styles.dateButtonText}>
              Início: {startDate ? startDate.toLocaleDateString('pt-BR') : 'DD/MM/AAAA'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('end')}>
            <Calendar size={18} color={endDate ? "#1d4ed8" : "#4b5563"} />
            <Text style={styles.dateButtonText}>
              Fim: {endDate ? endDate.toLocaleDateString('pt-BR') : 'DD/MM/AAAA'}
            </Text>
          </TouchableOpacity>
          {(startDate || endDate) && (
            <TouchableOpacity style={styles.clearDateButton} onPress={clearDateFilter}>
              <XCircle size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Pesquisar..." value={searchTerm} onChangeText={setSearchTerm} />
        </View>

        {viewMode === 'recentes' ? (
          <FlatList
            data={processedData}
            keyExtractor={(item) => item.id}
            renderItem={renderRecentItem}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum resultado encontrado.</Text></View>}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        ) : (
          <SectionList
            sections={processedData}
            keyExtractor={(item, index) => item.id + index}
            renderItem={renderGroupedItem}
            renderSectionHeader={({ section: { title } }) => (<Text style={styles.sectionHeader}>{title}</Text>)}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum resultado encontrado.</Text></View>}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
      <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          cancelTextIOS="Cancelar"
          confirmTextIOS="Confirmar"
          headerTextIOS={datePickerMode === 'start' ? "Escolha a data de início" : "Escolha a data de fim"}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  mainContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 24, },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937' },
  exportButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#e0e7ff' },
  exportButtonText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 6 },
  viewModeContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#e5e7eb', borderRadius: 10, padding: 4, marginBottom: 16 },
  viewModeButton: { flex: 1, paddingVertical: 8, borderRadius: 8 },
  viewModeButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  viewModeText: { textAlign: 'center', color: '#4b5563', fontWeight: '600' },
  viewModeTextActive: { color: '#1d4ed8' },
  dateFilterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', },
  dateButtonText: { marginLeft: 8, color: '#4b5563', fontWeight: '500', },
  clearDateButton: { padding: 8, },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 24, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#1f2937' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#6b7280' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', backgroundColor: '#f3f4f6', paddingVertical: 8, paddingTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  statusDevolvido: { backgroundColor: '#dcfce7' },
  statusEmprestado: { backgroundColor: '#ffedd5' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
  cardBody: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoIcon: { marginRight: 8 },
  infoText: { color: '#4b5563', fontSize: 16 },
  infoDate: { color: '#6b7280', fontSize: 14 },
});