import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView, Image, FlatList, TouchableWithoutFeedback, ScrollView, ActivityIndicator } from 'react-native';
import { User, Fingerprint, Camera, ChevronDown, X, Save, Trash2, CheckCircle, Briefcase, Building2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPessoa, updatePessoa, getPerfis, updatePessoaStatus, API_URL } from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const EditarPessoa = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { pessoaId } = route.params;

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  
  const [fotoExibida, setFotoExibida] = useState(null);
  const [novaFotoUri, setNovaFotoUri] = useState(null);

  const [perfil, setPerfil] = useState(null);
  const [perfis, setPerfis] = useState([]);
  const [ativo, setAtivo] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Novo estado para permissão

  // Função para verificar o grupo do operador logado
  const checkAdminStatus = async () => {
    try {
      const operadorString = await AsyncStorage.getItem('operador');
      if (operadorString) {
        const operador = JSON.parse(operadorString);
        if (operador.grupo === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.error("Erro ao ler dados do operador:", e);
    }
  };

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    try {
      await checkAdminStatus(); // Verifica o status de admin
      const [pessoaRes, perfisRes] = await Promise.all([getPessoa(pessoaId), getPerfis()]);
      
      if (!pessoaRes.ok || !perfisRes.ok) throw new Error('Falha ao carregar dados iniciais.');
      
      const pessoaData = await pessoaRes.json();
      const perfisData = await perfisRes.json();

      setNome(pessoaData.nome_completo);
      setDocumento(pessoaData.documento);
      setIdentificador(pessoaData.identificador_funcional);
      setCargo(pessoaData.cargo || '');
      setDepartamento(pessoaData.departamento || '');
      setAtivo(pessoaData.ativo);
      setPerfis(perfisData);

      if (pessoaData.foto_url) {
        const correctedPath = pessoaData.foto_url.replace(/\\/g, '/');
        setFotoExibida(`${API_URL}/${correctedPath}`);
      } else {
        setFotoExibida(null); 
      }
      
      const perfilInicial = perfisData.find(p => p.id === pessoaData.perfil_id);
      setPerfil(perfilInicial);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados da pessoa.');
    } finally {
      setIsLoading(false);
    }
  }, [pessoaId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', carregarDados);
    return unsubscribe;
  }, [navigation, carregarDados]);

  const tirarFoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Acesso negado!", "Você precisa permitir o acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setNovaFotoUri(uri);
      setFotoExibida(uri);
    }
  };

  const handleSalvar = async () => {
    if (!nome.trim() || !documento.trim() || !identificador.trim()) {
      Alert.alert('Atenção', 'Nome, documento e matrícula são obrigatórios.');
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('nome_completo', nome.trim());
    formData.append('documento', documento.trim());
    formData.append('identificador_funcional', identificador.trim());
    formData.append('cargo', cargo.trim());
    formData.append('departamento', departamento.trim());
    if (perfil) formData.append('perfil_id', perfil.id);
    
    if (novaFotoUri) {
      const uriParts = novaFotoUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      let fileType = fileName.split('.').pop();
      const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
      formData.append('foto', { uri: novaFotoUri, name: fileName, type: mimeType });
    }

    try {
      const response = await updatePessoa(pessoaId, formData);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao atualizar pessoa.');
      }
      Alert.alert('Sucesso', 'Cadastro atualizado!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleAtivo = async () => {
      const novoStatus = !ativo;
      const acao = novoStatus ? 'reativar' : 'desativar';
      Alert.alert(`Confirmar`, `Tem certeza que deseja ${acao} esta pessoa?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: async () => {
              try {
                  const response = await updatePessoaStatus(pessoaId, novoStatus);
                  if (!response.ok) throw new Error(`Falha ao ${acao} a pessoa.`);
                  setAtivo(novoStatus);
                  Alert.alert('Sucesso', `Pessoa ${novoStatus ? 'reativada' : 'desativada'}!`);
              } catch (error) {
                  Alert.alert('Erro', error.message);
              }
          }}
      ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView>
          <View style={styles.mainContainer}>
            <Text style={styles.headerTitle}>Editar Pessoa</Text>
            <TouchableOpacity style={styles.fotoPicker} onPress={tirarFoto}>
              {fotoExibida ? <Image source={{ uri: fotoExibida }} style={styles.foto} /> : <Camera size={40} color="#6b7280" />}
            </TouchableOpacity>
            <View style={styles.inputContainer}><User size={20} color="#6b7280" /><TextInput value={nome} onChangeText={setNome} style={styles.input} placeholder="Nome completo *" placeholderTextColor="#888" /></View>
            <View style={styles.inputContainer}><Fingerprint size={20} color="#6b7280" /><TextInput value={documento} onChangeText={setDocumento} style={styles.input} placeholder="Documento *"  placeholderTextColor="#888"/></View>
            <View style={styles.inputContainer}><Fingerprint size={20} color="#6b7280" /><TextInput value={identificador} onChangeText={setIdentificador} style={styles.input} placeholder="Matrícula/SIAPE *" placeholderTextColor="#888" /></View>
            <View style={styles.inputContainer}><Briefcase size={20} color="#6b7280" /><TextInput value={cargo} onChangeText={setCargo} style={styles.input} placeholder="Cargo (opcional)"  placeholderTextColor="#888"/></View>
            <View style={styles.inputContainer}><Building2 size={20} color="#6b7280" /><TextInput value={departamento} onChangeText={setDepartamento} style={styles.input} placeholder="Departamento (opcional)" placeholderTextColor="#888" /></View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.inputContainer}>
              <Text style={perfil ? styles.input : styles.placeholderText}>{perfil?.nome || "Selecione um perfil"}</Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
        <View style={styles.footerButtons}>
          {/* O botão de ativar/desativar só aparece para administradores */}
          {isAdmin && (
            <TouchableOpacity onPress={handleToggleAtivo} style={[styles.toggleButton, ativo ? styles.deactivateButton : styles.activateButton]}>
              {ativo ? <Trash2 size={20} color="#fff" /> : <CheckCircle size={20} color="#fff" />}
              <Text style={styles.toggleButtonText}>{ativo ? 'Desativar' : 'Reativar'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSalvar} style={[styles.saveButton, !isAdmin && { flex: 1, marginLeft: 0 }]} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Salvar</Text></>}
          </TouchableOpacity>
        </View>
        {modalVisible && (
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}><Text style={styles.modalTitle}>Selecione o Perfil</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#6b7280" /></TouchableOpacity></View>
                <FlatList data={perfis} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => { setPerfil(item); setModalVisible(false); }}>
                    <Text style={styles.modalItemText}>{item.nome}</Text>
                  </TouchableOpacity>
                )} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    mainContainer: { padding: 24, paddingBottom: 20 },
    headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
    fotoPicker: { height: 140, width: 140, borderRadius: 70, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 32, overflow: 'hidden' },
    foto: { height: '100%', width: '100%' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16, },
    input: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
    placeholderText: { flex: 1, fontSize: 16, color: '#9ca3af', marginLeft: 12 },
    footerButtons: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
    toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginRight: 8, },
    deactivateButton: { backgroundColor: '#ef4444' },
    activateButton: { backgroundColor: '#22c55e' },
    toggleButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    saveButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb', marginLeft: 8 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalItemText: { fontSize: 18, color: '#1f2937' },
});

