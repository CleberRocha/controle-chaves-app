import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView, Image, FlatList, TouchableWithoutFeedback, ScrollView, ActivityIndicator } from 'react-native';
import { User, Fingerprint, Camera, ChevronDown, X, Save, Briefcase, Building2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { createPessoa, getPerfis } from '../services/apiService';

export const NovaPessoa = () => {
  const navigation = useNavigation();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [fotoUri, setFotoUri] = useState(null); // Armazena apenas a URI da imagem
  const [perfil, setPerfil] = useState(null);
  const [perfis, setPerfis] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPerfis = async () => {
      try {
        const response = await getPerfis();
        const data = await response.json();
        setPerfis(data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os perfis de acesso.');
      }
    };
    fetchPerfis();
  }, []);

  const tirarFoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Acesso negado!", "Você precisa permitir o acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setFotoUri(result.assets[0].uri);
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
    if (perfil) {
      formData.append('perfil_id', perfil.id);
    }
    if (fotoUri) {
      const uriParts = fotoUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('foto', {
        uri: fotoUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    try {
      const response = await createPessoa(formData);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro desconhecido ao salvar pessoa.');
      }
      Alert.alert('Sucesso', 'Pessoa cadastrada!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao salvar o cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView>
          <View style={styles.mainContainer}>
            <Text style={styles.headerTitle}>Nova Pessoa</Text>
            <TouchableOpacity style={styles.fotoPicker} onPress={tirarFoto}>
              {fotoUri ? <Image source={{ uri: fotoUri }} style={styles.foto} /> : <Camera size={40} color="#6b7280" />}
            </TouchableOpacity>
            <View style={styles.inputContainer}><User size={20} color="#6b7280" /><TextInput value={nome} onChangeText={setNome} style={styles.input} placeholder="Nome completo *" placeholderTextColor="#888" /></View>
            <View style={styles.inputContainer}><Fingerprint size={20} color="#6b7280" /><TextInput value={documento} onChangeText={setDocumento} style={styles.input} placeholder="Documento *" placeholderTextColor="#888" /></View>
            <View style={styles.inputContainer}><Fingerprint size={20} color="#6b7280" /><TextInput value={identificador} onChangeText={setIdentificador} style={styles.input} placeholder="Matrícula/SIAPE *" placeholderTextColor="#888" /></View>
            <View style={styles.inputContainer}><Briefcase size={20} color="#6b7280" /><TextInput value={cargo} onChangeText={setCargo} style={styles.input} placeholder="Cargo (opcional)" placeholderTextColor="#888" /></View>
            <View style={styles.inputContainer}><Building2 size={20} color="#6b7280" /><TextInput value={departamento} onChangeText={setDepartamento} style={styles.input} placeholder="Departamento (opcional)" placeholderTextColor="#888" /></View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.inputContainer}>
              <Text style={perfil ? styles.input : styles.placeholderText}>{perfil?.nome || "Selecione um perfil"}</Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
        <View style={styles.footerButtons}>
          <TouchableOpacity onPress={handleSalvar} style={styles.saveButton} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Salvar Cadastro</Text></>}
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
    footerButtons: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb' },
    saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalItemText: { fontSize: 18, color: '#1f2937' },
});

