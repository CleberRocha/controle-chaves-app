// screens/EditarChave.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyRound, FileText, Check, Trash2, CheckCircle } from 'lucide-react-native';

const PERFIS = ["Professores", "Alunos", "Funcionários", "Terceirizados", "Servidores"];

const InputWithIcon = ({ icon, placeholder, value, onChangeText }) => (
  <View style={styles.inputContainer}>
    {icon}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
    />
  </View>
);

export const EditarChave = ({ route, navigation }) => {
  const { chaveId } = route.params;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [perfisPermitidos, setPerfisPermitidos] = useState([]);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    const carregarChave = async () => {
      const chavesData = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
      const chaveParaEditar = chavesData.find(c => c.id === chaveId);
      if (chaveParaEditar) {
        setNome(chaveParaEditar.nome);
        setDescricao(chaveParaEditar.descricao || '');
        setPerfisPermitidos(chaveParaEditar.perfisPermitidos || []);
        setAtivo(chaveParaEditar.ativo !== false);
      }
    };
    carregarChave();
  }, [chaveId]);

  const togglePerfil = (perfil) => {
    if (perfisPermitidos.includes(perfil)) {
      setPerfisPermitidos(perfisPermitidos.filter(p => p !== perfil));
    } else {
      setPerfisPermitidos([...perfisPermitidos, perfil]);
    }
  };

  const selecionarTodos = () => {
    if (perfisPermitidos.length === PERFIS.length) {
      setPerfisPermitidos([]);
    } else {
      setPerfisPermitidos(PERFIS);
    }
  };

  const handleSalvar = async () => {
    if (!nome.trim() || perfisPermitidos.length === 0) {
      Alert.alert('Atenção', 'Nome da chave e pelo menos um perfil são obrigatórios.');
      return;
    }
    const chavesAntigas = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
    const chavesNovas = chavesAntigas.map(c => {
      if (c.id === chaveId) {
        return { ...c, nome, descricao, perfisPermitidos, ativo };
      }
      return c;
    });
    await AsyncStorage.setItem('chaves', JSON.stringify(chavesNovas));
    Alert.alert('Sucesso', 'Chave atualizada!');
    navigation.goBack();
  };

  const handleToggleAtivo = async () => {
    const novoStatus = !ativo;
    const acao = novoStatus ? 'reativar' : 'desativar';
    Alert.alert(`Confirmar ${acao}`, `Tem certeza que deseja ${acao} esta chave?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: novoStatus ? 'default' : 'destructive', onPress: async () => {
          setAtivo(novoStatus); // Atualiza o estado local para feedback imediato na UI
          // Salva a alteração imediatamente
          const chavesAntigas = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
          const chavesNovas = chavesAntigas.map(c => c.id === chaveId ? { ...c, ativo: novoStatus } : c);
          await AsyncStorage.setItem('chaves', JSON.stringify(chavesNovas));
          Alert.alert('Sucesso', `Chave ${novoStatus ? 'reativada' : 'desativada'}!`);
          navigation.goBack();
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.mainContainer}>
          <Text style={styles.headerTitle}>Editar Chave</Text>
          <InputWithIcon
            icon={<KeyRound size={20} color="#6b7280" />}
            placeholder="Nome da Chave (Ex: Sala 101)"
            value={nome}
            onChangeText={setNome}
          />
          <InputWithIcon
            icon={<FileText size={20} color="#6b7280" />}
            placeholder="Descrição (opcional)"
            value={descricao}
            onChangeText={setDescricao}
          />
          <View style={styles.perfisContainer}>
            <View style={styles.perfisHeader}>
              <Text style={styles.label}>Perfis Permitidos</Text>
              <TouchableOpacity onPress={selecionarTodos}>
                <Text style={styles.selecionarTodosBtn}>
                  {perfisPermitidos.length === PERFIS.length ? "Limpar Todos" : "Selecionar Todos"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.perfisGrid}>
              {PERFIS.map(perfil => {
                const isSelected = perfisPermitidos.includes(perfil);
                return (
                  <TouchableOpacity key={perfil} style={[styles.perfilChip, isSelected && styles.perfilChipSelected]} onPress={() => togglePerfil(perfil)}>
                    <Text style={[styles.perfilChipText, isSelected && styles.perfilChipTextSelected]}>{perfil}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footerButtons}>
        <TouchableOpacity onPress={handleToggleAtivo} style={[styles.toggleButton, ativo ? styles.deactivateButton : styles.activateButton]}>
          {ativo ? <Trash2 size={20} color="#fff" /> : <CheckCircle size={20} color="#fff" />}
          <Text style={styles.toggleButtonText}>{ativo ? 'Desativar' : 'Reativar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSalvar} style={styles.saveButton}>
          <Check size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  mainContainer: { padding: 24, paddingBottom: 100 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowRadius: 1, shadowOpacity: 0.1, shadowOffset: { height: 1, width: 0 } },
  input: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
  label: { color: '#374151', fontWeight: '600', fontSize: 16, marginBottom: 8 },
  perfisContainer: { marginTop: 16 },
  perfisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selecionarTodosBtn: { color: '#2563eb', fontWeight: 'bold' },
  perfisGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  perfilChip: { backgroundColor: '#e5e7eb', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, margin: 4 },
  perfilChipSelected: { backgroundColor: '#2563eb' },
  perfilChipText: { color: '#374151', fontWeight: '500' },
  perfilChipTextSelected: { color: '#ffffff' },
  footerButtons: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#f3f4f6' },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginRight: 8, },
  deactivateButton: { backgroundColor: '#ef4444' },
  activateButton: { backgroundColor: '#22c55e' },
  toggleButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  saveButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb', marginLeft: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});