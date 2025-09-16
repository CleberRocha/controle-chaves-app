import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Users, Clock, Save } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { updatePerfil } from '../services/apiService';

// Mapa para traduzir entre nomes e números dos dias
const diasMap = {
  segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, domingo: 0
};
const diasMapInverso = {
  1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado', 0: 'domingo'
};

const diasOptions = [
  { label: 'Seg', value: 'segunda' }, { label: 'Ter', value: 'terca' },
  { label: 'Qua', value: 'quarta' }, { label: 'Qui', value: 'quinta' },
  { label: 'Sex', value: 'sexta' }, { label: 'Sáb', value: 'sabado' },
  { label: 'Dom', value: 'domingo' },
];

export const EditarPerfil = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { perfil: perfilInicial } = route.params;

  const [nome, setNome] = useState(perfilInicial.nome);
  const [horaInicio, setHoraInicio] = useState(perfilInicial.hora_inicio || '');
  const [horaFim, setHoraFim] = useState(perfilInicial.hora_fim || '');
  
  // CORREÇÃO 1: Converte os dias (números) recebidos para strings para o estado inicial
  const [diasSemana, setDiasSemana] = useState(() => 
    (perfilInicial.dias_semana || []).map(diaNum => diasMapInverso[diaNum]).filter(Boolean)
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState('inicio');

  const handleToggleDia = (dia) => {
    setDiasSemana(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  const showPicker = (mode) => {
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const handleConfirmPicker = (time) => {
    const formattedTime = time.toTimeString().split(' ')[0].substring(0, 5);
    if (pickerMode === 'inicio') setHoraInicio(formattedTime);
    else setHoraFim(formattedTime);
    setPickerVisible(false);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do perfil é obrigatório.');
      return;
    }
    setIsLoading(true);
    try {
      // CORREÇÃO 2: Converte os dias (strings) do estado para números antes de enviar
      const diasComoNumeros = diasSemana.map(diaStr => diasMap[diaStr]);

      const payload = {
        nome: nome.trim(),
        hora_inicio: horaInicio || null,
        hora_fim: horaFim || null,
        dias_semana: diasComoNumeros.length > 0 ? diasComoNumeros : null,
      };
      
      const response = await updatePerfil(perfilInicial.id, payload);
      setIsLoading(false);

      if (response.status === 403) {
        Alert.alert('Acesso Negado', 'Você não tem permissão para editar perfis.');
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao editar perfil.');
      }
      Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.mainContainer}>
          <Text style={styles.headerTitle}>Editar Perfil de Acesso</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Nome do Perfil *</Text>
            <View style={styles.inputContainer}>
              <Users size={20} color="#6b7280" />
              <TextInput value={nome} onChangeText={setNome} style={styles.input} placeholder="Ex: Portaria, Limpeza" />
            </View>
            <View style={styles.timeRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Início do Acesso</Text>
                <TouchableOpacity onPress={() => showPicker('inicio')} style={styles.inputContainer}>
                  <Clock size={20} color="#6b7280" />
                  <Text style={styles.input}>{horaInicio || '--:--'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Fim do Acesso</Text>
                <TouchableOpacity onPress={() => showPicker('fim')} style={styles.inputContainer}>
                  <Clock size={20} color="#6b7280" />
                  <Text style={styles.input}>{horaFim || '--:--'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.label}>Dias da Semana Permitidos</Text>
            <View style={styles.weekContainer}>
              {diasOptions.map(dia => (
                <TouchableOpacity
                  key={dia.value}
                  style={[styles.dayButton, diasSemana.includes(dia.value) && styles.dayButtonSelected]}
                  onPress={() => handleToggleDia(dia.value)}
                >
                  <Text style={[styles.dayButtonText, diasSemana.includes(dia.value) && styles.dayButtonTextSelected]}>
                    {dia.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSalvar} style={styles.saveButton} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Salvar Alterações</Text></>}
        </TouchableOpacity>
      </View>
      <DateTimePickerModal isVisible={isPickerVisible} mode="time" onConfirm={handleConfirmPicker} onCancel={() => setPickerVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  mainContainer: { padding: 24 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8, fontSize: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dayButton: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 15, margin: 4 },
  dayButtonSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  dayButtonText: { color: '#374151', fontWeight: 'bold' },
  dayButtonTextSelected: { color: '#fff' },
  footer: { padding: 16, backgroundColor: '#f3f4f6' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});

