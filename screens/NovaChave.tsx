// screens/NovaChave.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyRound, FileText, Check } from 'lucide-react-native';

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

export const NovaChave = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [perfisPermitidos, setPerfisPermitidos] = useState([]);

  const togglePerfil = (perfil) => {
    if (perfisPermitidos.includes(perfil)) {
      setPerfisPermitidos(perfisPermitidos.filter(p => p !== perfil));
    } else {
      setPerfisPermitidos([...perfisPermitidos, perfil]);
    }
  };

  const selecionarTodos = () => {
    if (perfisPermitidos.length === PERFIS.length) {
      setPerfisPermitidos([]); // Limpa todos
    } else {
      setPerfisPermitidos(PERFIS); // Seleciona todos
    }
  };

  const salvarChave = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome da chave é obrigatório.');
      return;
    }
    if (perfisPermitidos.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um perfil permitido.');
      return;
    }

    const novaChave = { 
      id: Date.now().toString(), 
      nome, 
      descricao,
      perfisPermitidos,
      ativo: true,
    };

    const chavesExistentes = JSON.parse(await AsyncStorage.getItem('chaves') || '[]');
    await AsyncStorage.setItem('chaves', JSON.stringify([...chavesExistentes, novaChave]));

    Alert.alert('Sucesso', 'Chave cadastrada com sucesso!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.mainContainer}>
            <View>
              <Text style={styles.headerTitle}>Nova Chave</Text>
              
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

              {/* Seletor de Perfis */}
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
                      <TouchableOpacity 
                        key={perfil} 
                        style={[styles.perfilChip, isSelected && styles.perfilChipSelected]} 
                        onPress={() => togglePerfil(perfil)}
                      >
                        <Text style={[styles.perfilChipText, isSelected && styles.perfilChipTextSelected]}>{perfil}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={salvarChave} style={styles.confirmButton}>
              <Check size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.confirmButtonText}>Salvar Chave</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  mainContainer: { flex: 1, padding: 24, justifyContent: 'space-between', minHeight: '95%' },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2 },
  input: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
  label: { color: '#374151', fontWeight: '600', fontSize: 16, marginBottom: 8 },
  confirmButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8, marginTop: 24 },
  confirmButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  buttonIcon: { marginRight: 8 },
  // Estilos dos Perfis
  perfisContainer: { marginTop: 16 },
  perfisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selecionarTodosBtn: { color: '#2563eb', fontWeight: 'bold' },
  perfisGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  perfilChip: { backgroundColor: '#e5e7eb', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, margin: 4 },
  perfilChipSelected: { backgroundColor: '#2563eb' },
  perfilChipText: { color: '#374151', fontWeight: '500' },
  perfilChipTextSelected: { color: '#ffffff' },
});