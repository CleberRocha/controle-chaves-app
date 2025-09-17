import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, FlatList, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MapPin, User, FileText, Camera, Paperclip, X, Save, ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { createOcorrencia, getLocais } from '../services/apiService';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Componente de botão de seleção reutilizável
const SelectionButton = ({ label, value, placeholder, onPress }) => (
    <View style={styles.selectionContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.inputContainer}>
        <Text style={value ? styles.inputText : styles.placeholderText}>{value || placeholder}</Text>
        <ChevronDown size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
);

export const NovaOcorrencia = () => {
  const navigation = useNavigation();
  const [local, setLocal] = useState(null);
  const [locais, setLocais] = useState([]);
  const [responsavel, setResponsavel] = useState('');
  const [descricao, setDescricao] = useState('');
  const [anexos, setAnexos] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  useEffect(() => {
    // Carrega o nome do operador logado e a lista de locais
    const carregarDadosIniciais = async () => {
      try {
        const operadorString = await AsyncStorage.getItem('operador');
        if (operadorString) {
          const operador = JSON.parse(operadorString);
          setResponsavel(operador.nome_completo);
        }
        
        const response = await getLocais();
        const data = await response.json();
        setLocais(data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados necessários.');
      }
    };
    carregarDadosIniciais();
  }, []);

  const tirarFoto = async () => {
    if (isPicking) return; 
    setIsPicking(true); 

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Acesso negado!", "Você precisa permitir o acesso à câmera.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (!result.canceled) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop();
        const fileType = asset.type ? `${asset.type}/jpeg` : 'image/jpeg';
        setAnexos(prev => [...prev, { uri: asset.uri, name: fileName, type: fileType }]);
      }
    } catch (error) {
        console.error("Erro ao tirar foto:", error);
        Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    } finally {
        setIsPicking(false); 
    }
  };

  const escolherAnexo = async () => {
    if (isPicking) return; 
    setIsPicking(true); 

    try {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
        
        if (result.canceled === false) {
           const novosAnexos = result.assets.map(asset => ({
             uri: asset.uri,
             name: asset.name,
             type: asset.mimeType,
           }));
           setAnexos(prev => [...prev, ...novosAnexos]);
        }
    } catch (error) {
      console.error("Erro ao selecionar documento:", error);
    } finally {
        setIsPicking(false); 
    }
  };

  const removerAnexo = (uri) => {
    setAnexos(prev => prev.filter(anexo => anexo.uri !== uri));
  };

  const handleSalvar = async () => {
    if (!local) {
      Alert.alert('Atenção', 'O local é obrigatório.');
      return;
    }
    if (!descricao.trim()) {
      Alert.alert('Atenção', 'A descrição da ocorrência é obrigatória.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('local_id', local.id);
    formData.append('responsavel_registro', responsavel.trim());
    formData.append('descricao', descricao.trim());

    // CORREÇÃO AQUI: Formatando os anexos para o FormData
    for (const anexo of anexos) {
        const uriParts = anexo.name.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const anexoParaEnvio = {
          uri: anexo.uri,
          name: `${new Date().getTime()}-${anexo.name}`, // Adiciona um timestamp para evitar nomes duplicados
          type: anexo.type || `application/${fileType}`, // Garante um mimetype
        };
        formData.append('anexos', anexoParaEnvio);
    }

    try {
      const response = await createOcorrencia(formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registrar ocorrência.');
      }
      Alert.alert('Sucesso', 'Ocorrência registrada!');
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao salvar ocorrência:", error);
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Componente para renderizar cada anexo
  const AnexoItem = ({ item }) => (
    <View style={styles.anexoItem}>
      {item.type && item.type.startsWith('image/') ? (
        <Image source={{ uri: item.uri }} style={styles.anexoPreview} />
      ) : (
        <View style={styles.anexoPreviewPlaceholder}>
          <FileText size={24} color="#6b7280" />
        </View>
      )}
      <Text style={styles.anexoName} numberOfLines={1}>{item.name}</Text>
      <TouchableOpacity onPress={() => removerAnexo(item.uri)}>
        <X size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.mainContainer}>
          <Text style={styles.headerTitle}>Nova Ocorrência</Text>
          
          <SelectionButton
            label="Local da Ocorrência"
            value={local?.nome}
            placeholder="Selecione um local *"
            onPress={() => setModalVisible(true)}
          />

          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" />
            {/* CORREÇÃO AQUI: Removido 'editable={false}' e adicionado onChangeText */}
            <TextInput 
              value={responsavel} 
              onChangeText={setResponsavel}
              style={styles.inputText} 
              placeholder="Responsável pelo registro"
              placeholderTextColor="#888" 
            />
          </View>          
          <View style={[styles.inputContainer, { height: 120, alignItems: 'flex-start' }]}>
            <FileText size={20} color="#6b7280" style={{ marginTop: 16 }} />
            <TextInput 
              value={descricao} 
              onChangeText={setDescricao} 
              style={[styles.inputText, { textAlignVertical: 'top' }]} 
              placeholder="Descreva a ocorrência *" 
              multiline 
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.anexoContainer}>
            <TouchableOpacity 
                style={[styles.anexoButton, isPicking && styles.disabledButton]} 
                onPress={tirarFoto}
                disabled={isPicking}
            >
              <Camera size={20} color={isPicking ? '#9ca3af' : "#3b82f6"} />
              <Text style={[styles.anexoButtonText, isPicking && styles.disabledButtonText]}>Tirar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.anexoButton, isPicking && styles.disabledButton]} 
                onPress={escolherAnexo}
                disabled={isPicking}
            >
              <Paperclip size={20} color={isPicking ? '#9ca3af' : "#3b82f6"} />
              <Text style={[styles.anexoButtonText, isPicking && styles.disabledButtonText]}>Anexar Arquivo</Text>
            </TouchableOpacity>
          </View>
          
          {anexos.map(item => (
            <AnexoItem key={item.uri} item={item} />
          ))}

        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSalvar} style={styles.saveButton} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Registrar Ocorrência</Text></>}
        </TouchableOpacity>
      </View>

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Local</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <FlatList
              data={locais}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setLocal(item); setModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{item.nome}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  mainContainer: { padding: 24 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  selectionContainer: { marginBottom: 16 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 },
  inputText: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
  placeholderText: { flex: 1, fontSize: 16, color: '#9ca3af' },
  anexoContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  anexoButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  anexoButtonText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 8 },
  disabledButton: { backgroundColor: '#e5e7eb' },
  disabledButtonText: { color: '#9ca3af' },
  anexoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  anexoPreview: { width: 40, height: 40, borderRadius: 4, marginRight: 12 },
  anexoPreviewPlaceholder: { width: 40, height: 40, borderRadius: 4, marginRight: 12, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  anexoName: { flex: 1, color: '#374151' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalItemText: { fontSize: 18 },
});

