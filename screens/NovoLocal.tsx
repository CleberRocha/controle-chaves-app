import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, ActivityIndicator, FlatList } from 'react-native'
import { MapPin, FileText, Lock, Save, ChevronDown, X } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { createLocal } from '../services/apiService'

export const NovoLocal = () => {
  const navigation = useNavigation()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipoAcesso, setTipoAcesso] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setModalVisible] = useState(false)

  const tipoAcessoOptions = ['Restrito', 'Geral']

  const handleSalvar = async () => {
    if (!nome.trim() || !tipoAcesso.trim()) {
      Alert.alert('Atenção', 'Nome e Tipo de Acesso são obrigatórios.')
      return
    }
    setIsLoading(true)
    try {
      // CORREÇÃO APLICADA AQUI: Convertendo para minúsculas
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        tipo_acesso: tipoAcesso.toLowerCase()
      }
      const response = await createLocal(payload)

      if (response.status === 403) {
        setIsLoading(false)
        Alert.alert('Acesso Negado', 'Você não tem permissão para criar locais.')
        return
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao criar local.')
      }

      setIsLoading(false)
      Alert.alert(
        'Sucesso',
        'Local cadastrado!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      setIsLoading(false)
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao salvar o cadastro.')
    }
  }

  const renderModal = () => (
    <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione o Tipo de Acesso</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <FlatList
                data={tipoAcessoOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setTipoAcesso(item); setModalVisible(false); }}>
                    <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
                )}
            />
        </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <Text style={styles.headerTitle}>Novo Local</Text>
          <View style={styles.inputContainer}><MapPin size={20} color="#6b7280" /><TextInput value={nome} onChangeText={setNome} style={styles.input} placeholder="Nome do Local *" /></View>
          <View style={styles.inputContainer}><FileText size={20} color="#6b7280" /><TextInput value={descricao} onChangeText={setDescricao} style={styles.input} placeholder="Descrição (Opcional)" /></View>

          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.inputContainer}>
            <Lock size={20} color="#6b7280" />
            <Text style={tipoAcesso ? styles.input : styles.placeholderText}>{tipoAcesso || "Tipo de Acesso *"}</Text>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity onPress={handleSalvar} style={styles.saveButton} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Salvar Local</Text></>}
            </TouchableOpacity>
        </View>

        {isModalVisible && renderModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  mainContainer: { flex: 1, padding: 24 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
  placeholderText: { flex: 1, fontSize: 16, color: '#9ca3af', marginLeft: 12 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalItemText: { fontSize: 18, color: '#374151' }
})

