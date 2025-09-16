import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, SectionList, FlatList, StyleSheet, SafeAreaView, Alert, TouchableOpacity, TextInput, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { KeyRound, User, Calendar, CheckCircle, Search, MapPin, ChevronDown, X, XCircle, FileDown } from 'lucide-react-native';
import { getRelatorioMovimentacoes, getLocais } from '../services/apiService';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Função que gera o conteúdo HTML do relatório
const gerarConteudoHtml = (dados, modo) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  let corpoTabela = '';
  const tituloRelatorio = modo === 'porPessoa' ? 'Agrupado por Pessoa' : modo === 'porChave' ? 'Agrupado por Chave' : 'Ordem Cronológica';

  if (modo === 'recentes') {
    corpoTabela = dados.map(item => `
      <tr>
        <td>${item.codigo_chave || ''}</td>
        <td>${item.pessoa_nome || ''}</td>
        <td>${item.local_nome || ''}</td>
        <td>${new Date(item.data_retirada).toLocaleString('pt-BR')}</td>
        <td>${item.data_devolucao ? new Date(item.data_devolucao).toLocaleString('pt-BR') : 'Em andamento'}</td>
      </tr>
    `).join('');
  } else {
    dados.forEach(secao => {
      corpoTabela += `
        <tr>
          <td colspan="4" class="section-header">${secao.title}</td>
        </tr>
      `;
      secao.data.forEach(item => {
        corpoTabela += `
          <tr>
            <td>${modo === 'porPessoa' ? (item.codigo_chave || '') : (item.pessoa_nome || '')}</td>
            <td>${item.local_nome || ''}</td>
            <td>${new Date(item.data_retirada).toLocaleString('pt-BR')}</td>
            <td>${item.data_devolucao ? `Devolvido` : 'Em andamento'}</td>
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
          body { font-family: sans-serif; color: #333; }
          h1 { text-align: center; color: #1f2937; font-size: 20px; }
          h2 { text-align: center; color: #6b7280; font-size: 14px; font-weight: normal; margin-top: -10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; word-break: break-word; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .section-header { background-color: #e5e7eb; font-weight: bold; font-size: 12px; padding: 10px; }
        </style>
      </head>
      <body>
        <h1>Relatório de Histórico</h1>
        <h2>Visão: ${tituloRelatorio} | Gerado em: ${dataAtual}</h2>
        <table>
          <thead>
            ${modo === 'recentes' ? `
              <tr>
                <th>Chave</th>
                <th>Pessoa</th>
                <th>Local</th>
                <th>Retirada</th>
                <th>Devolução</th>
              </tr>
            ` : `
              <tr>
                <th>${modo === 'porPessoa' ? 'Chave' : 'Pessoa'}</th>
                <th>Local</th>
                <th>Retirada</th>
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

// CORREÇÃO: Definição do componente que estava faltando
const SelectionButton = ({ label, value, placeholder, onPress }) => (
    <View style={styles.selectionContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.button}>
        <Text style={value ? styles.buttonText : styles.placeholderText}>{value || placeholder}</Text>
        <ChevronDown size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
);

export const Historico = () => {
  const [historico, setHistorico] = useState([]);
  const [todosLocais, setTodosLocais] = useState([]);
  const [viewMode, setViewMode] = useState('recentes');
  const [searchTerm, setSearchTerm] = useState('');
  const [localFiltro, setLocalFiltro] = useState(null);
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!startDate || !endDate) {
          setHistorico([]);
          setIsLoading(false);
          return;
      }
      const params = {
        local_id: localFiltro ? localFiltro.id : undefined,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        // O search é feito no frontend, não é enviado para a API
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const [historicoRes, locaisRes] = await Promise.all([
          getRelatorioMovimentacoes(params),
          todosLocais.length === 0 ? getLocais() : Promise.resolve({ ok: true, json: () => todosLocais })
      ]);

      if (!historicoRes.ok || !locaisRes.ok) throw new Error("Não foi possível carregar os dados.");

      const historicoData = await historicoRes.json();
      const locaisData = todosLocais.length === 0 ? await locaisRes.json() : todosLocais;

      setHistorico(historicoData);
      if (todosLocais.length === 0) setTodosLocais(locaisData);

    } catch (e) { 
      Alert.alert("Erro", e.message || "Não foi possível carregar o histórico."); 
    } finally {
      setIsLoading(false);
    }
  }, [localFiltro, startDate, endDate, todosLocais.length]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const clientSideFilteredData = useMemo(() => {
    if (!searchTerm) return historico;
    const term = searchTerm.toLowerCase();
    return historico.filter(item => 
        (item.pessoa_nome && item.pessoa_nome.toLowerCase().includes(term)) ||
        (item.codigo_chave && item.codigo_chave.toLowerCase().includes(term))
    );
  }, [historico, searchTerm]);
  
  const processedData = useMemo(() => {
    const dataToProcess = clientSideFilteredData;
    if (viewMode === 'recentes') {
      return dataToProcess;
    }
    const grouped = dataToProcess.reduce((acc, emprestimo) => {
      const key = viewMode === 'porPessoa' ? emprestimo.pessoa_nome : emprestimo.codigo_chave;
      if (!acc[key]) acc[key] = [];
      acc[key].push(emprestimo);
      return acc;
    }, {});

    return Object.keys(grouped).map(title => ({
      title,
      data: grouped[title],
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [viewMode, clientSideFilteredData]);

  const handleExportPdf = async () => {
    const dataToExport = processedData || [];
    if (dataToExport.length === 0) {
      Alert.alert("Atenção", "Não há dados para exportar com os filtros atuais.");
      return;
    }
    try {
      const htmlContent = gerarConteudoHtml(dataToExport, viewMode);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Histórico' });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o arquivo PDF.");
    }
  };

  const renderGroupedItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {viewMode === 'porPessoa' ? item.codigo_chave : item.pessoa_nome}
        </Text>
        <View style={[styles.statusBadge, item.data_devolucao ? styles.statusDevolvido : styles.statusEmprestado]}>
          <Text style={styles.statusText}>{item.data_devolucao ? "Devolvida" : "Em Andamento"}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}><Calendar size={16} color="#6b7280" style={styles.infoIcon} /><Text style={styles.infoDate}>Retirada: {new Date(item.data_retirada).toLocaleString('pt-BR')}</Text></View>
        {item.data_devolucao && (<View style={styles.infoRow}><CheckCircle size={16} color="#16a34a" style={styles.infoIcon} /><Text style={styles.infoDate}>Devolução: {new Date(item.data_devolucao).toLocaleString('pt-BR')}</Text></View>)}
      </View>
    </View>
  );

  const renderRecentItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <KeyRound size={20} color="#1f2937" style={styles.infoIcon} />
        <Text style={styles.cardTitle}>{item.codigo_chave}</Text>
        <View style={[styles.statusBadge, item.data_devolucao ? styles.statusDevolvido : styles.statusEmprestado]}>
            <Text style={styles.statusText}>{item.data_devolucao ? "Devolvida" : "Em Andamento"}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}><User size={16} color="#6b7280" style={styles.infoIcon} /><Text style={styles.infoText}>Pessoa: {item.pessoa_nome}</Text></View>
        <View style={styles.infoRow}><MapPin size={16} color="#6b7280" style={styles.infoIcon} /><Text style={styles.infoText}>Local: {item.local_nome}</Text></View>
        <View style={styles.infoRow}><Calendar size={16} color="#6b7280" style={styles.infoIcon} /><Text style={styles.infoDate}>Retirada: {new Date(item.data_retirada).toLocaleString('pt-BR')}</Text></View>
        {item.data_devolucao && (<View style={styles.infoRow}><CheckCircle size={16} color="#16a34a" style={styles.infoIcon} /><Text style={styles.infoDate}>Devolução: {new Date(item.data_devolucao).toLocaleString('pt-BR')}</Text></View>)}
      </View>
    </View>
  );
  
  const showDatePicker = (mode) => { setDatePickerMode(mode); setDatePickerVisibility(true); };
  const hideDatePicker = () => { setDatePickerVisibility(false); };
  const handleConfirmDate = (date) => {
    if (datePickerMode === 'start') setStartDate(date);
    else setEndDate(date);
    hideDatePicker();
  };
  const clearDateFilter = () => { setStartDate(null); setEndDate(null); };

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
          <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('start')}><Calendar size={18} color={startDate ? "#1d4ed8" : "#4b5563"} /><Text style={styles.dateButtonText}>Início: {startDate ? startDate.toLocaleDateString('pt-BR') : 'Selecione'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('end')}><Calendar size={18} color={endDate ? "#1d4ed8" : "#4b5563"} /><Text style={styles.dateButtonText}>Fim: {endDate ? endDate.toLocaleDateString('pt-BR') : 'Selecione'}</Text></TouchableOpacity>
          {(startDate || endDate) && <TouchableOpacity style={styles.clearDateButton} onPress={clearDateFilter}><XCircle size={20} color="#ef4444" /></TouchableOpacity>}
        </View>

        <SelectionButton label="Filtrar por Local" value={localFiltro?.nome} placeholder="Todos os locais" onPress={() => setModalVisible(true)} />
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Filtrar por pessoa ou chave..." value={searchTerm} onChangeText={setSearchTerm} />
        </View>

        {isLoading ? <ActivityIndicator size="large" color="#2563eb" style={{flex: 1}}/> : (
            viewMode === 'recentes' ? (
                <FlatList data={processedData} keyExtractor={(item) => item.id.toString()} renderItem={renderRecentItem} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum resultado encontrado.</Text></View>} />
            ) : (
                <SectionList sections={processedData} keyExtractor={(item, index) => item.id.toString() + index} renderItem={renderGroupedItem} renderSectionHeader={({ section: { title } }) => (<Text style={styles.sectionHeader}>{title}</Text>)} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum resultado encontrado.</Text></View>} />
            )
        )}
      </View>
      <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirmDate} onCancel={hideDatePicker} />
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
                  <TouchableOpacity style={styles.modalItem} onPress={() => { setLocalFiltro(item.id ? item : null); setModalVisible(false); }}>
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
  mainContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 24, },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937' },
  exportButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#e0e7ff' },
  exportButtonText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 6 },
  viewModeContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 10, padding: 4, marginBottom: 16 },
  viewModeButton: { flex: 1, paddingVertical: 8, borderRadius: 8 },
  viewModeButtonActive: { backgroundColor: '#fff', elevation: 2 },
  viewModeText: { textAlign: 'center', color: '#4b5563', fontWeight: '600' },
  viewModeTextActive: { color: '#1d4ed8' },
  dateFilterContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10, },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', },
  dateButtonText: { marginLeft: 8, color: '#4b5563', },
  clearDateButton: { padding: 8, },
  selectionContainer: { marginBottom: 16 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
  button: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, height: 56, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16 },
  buttonText: { color: '#1f2937', fontSize: 16 },
  placeholderText: { color: '#9ca3af', fontSize: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#1f2937' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', backgroundColor: '#f3f4f6', paddingVertical: 8, paddingTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  statusDevolvido: { backgroundColor: '#dcfce7' },
  statusEmprestado: { backgroundColor: '#ffedd5' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  cardBody: { padding: 12, },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { marginRight: 8 },
  infoText: { color: '#4b5563', fontSize: 14 },
  infoDate: { color: '#6b7280', fontSize: 12 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalItemText: { fontSize: 18, color: '#1f2937' },
});

