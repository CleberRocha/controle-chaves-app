// screens/NovaPessoa.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView, Image, FlatList, TouchableWithoutFeedback, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Fingerprint, Check, Camera, ChevronDown, X, Phone, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const PERFIS = ["Professores", "Alunos", "Funcionários", "Terceirizados", "Servidores"];

// Componente reutilizável para inputs
const InputWithIcon = ({ icon, placeholder, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.inputContainer}>
    {icon}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboardType}
    />
  </View>
);

// Botão de seleção que abre o modal
const SelectionButton = ({ label, value, placeholder, onPress }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.inputContainer}>
        <Text style={value ? styles.input : styles.placeholderText}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
);

export const NovaPessoa = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [foto, setFoto] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
      setFoto(result.assets[0].uri);
    }
  };

  const handleSalvar = async () => {
    const documentoTrimmed = documento.trim();

    if (!nome.trim() || !documentoTrimmed || !perfil || !foto) {
      Alert.alert('Atenção', 'Todos os campos, exceto telefone, são obrigatórios.');
      return;
    }

    const todasAsPessoas = JSON.parse(await AsyncStorage.getItem('pessoas') || '[]');

    // Verifica se já existe uma pessoa com o mesmo documento
    const documentoExiste = todasAsPessoas.some(
      p => p.documento.toLowerCase() === documentoTrimmed.toLowerCase()
    );

    if (documentoExiste) {
      Alert.alert('Erro', 'Este documento já está cadastrado.');
      return; // Impede o salvamento
    }

    // Cria o novo objeto de pessoa
    const novaPessoa = {
      id: Date.now().toString(), // Gera um ID único
      nome: nome.trim(),
      documento: documentoTrimmed,
      telefone: telefone.trim(),
      foto,
      perfil,
      ativo: true
    };

    // Adiciona a nova pessoa à lista existente
    const pessoasNovas = [...todasAsPessoas, novaPessoa];
    await AsyncStorage.setItem('pessoas', JSON.stringify(pessoasNovas));
    Alert.alert('Sucesso', 'Pessoa cadastrada!');
    navigation.goBack();
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView>
          <View style={styles.mainContainer}>
            <Text style={styles.headerTitle}>Nova Pessoa</Text>
            
            <TouchableOpacity style={styles.fotoPicker} onPress={tirarFoto}>
              {foto ? (
                <Image source={{ uri: foto }} style={styles.foto} />
              ) : (
                <>
                  <Camera size={40} color="#6b7280" />
                  <Text style={styles.fotoPickerText}>Adicionar Foto</Text>
                </>
              )}
            </TouchableOpacity>

            <InputWithIcon
              icon={<User size={20} color="#6b7280" />}
              placeholder="Nome completo"
              value={nome}
              onChangeText={setNome}
            />
            <InputWithIcon
              icon={<Fingerprint size={20} color="#6b7280" />}
              placeholder="Documento ou crachá"
              value={documento}
              onChangeText={setDocumento}
            />
            <InputWithIcon
              icon={<Phone size={20} color="#6b7280" />}
              placeholder="Telefone (opcional)"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />
            <SelectionButton 
              label="Perfil"
              value={perfil}
              placeholder="Selecione um perfil"
              onPress={() => setModalVisible(true)}
            />
          </View>
        </ScrollView>
        <View style={styles.footerButtons}>
          <TouchableOpacity onPress={handleSalvar} style={styles.saveButton}>
            <Save size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Salvar Cadastro</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal para seleção de Perfil */}
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecione o Perfil</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <X size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={PERFIS}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setPerfil(item);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    mainContainer: { padding: 24, paddingBottom: 20 },
    headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
    fotoPicker: { height: 140, width: 140, borderRadius: 70, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 32, overflow: 'hidden' },
    foto: { height: '100%', width: '100%' },
    fotoPickerText: { marginTop: 8, color: '#6b7280' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2 },
    input: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
    label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
    placeholderText: { flex: 1, fontSize: 16, color: '#9ca3af' },
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