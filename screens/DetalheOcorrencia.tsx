import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { Calendar, User, MapPin, FileText, Paperclip } from 'lucide-react-native';
import { API_URL } from '../services/apiService'; // Importa a URL base da sua API

export const DetalheOcorrencia = ({ route }) => {
  // Recebe os dados da ocorrência via parâmetro de navegação
  const { ocorrencia } = route.params;

  // Formata a data e hora para exibição
  const formattedDate = new Date(ocorrencia.data_hora).toLocaleDateString('pt-BR');
  const formattedTime = new Date(ocorrencia.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Função para abrir um anexo
  const handleOpenAnexo = async (anexo) => {
    const fileUrl = `${API_URL}/${anexo.url}`;
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Erro', `Não é possível abrir este tipo de arquivo: ${fileUrl}`);
      }
    } catch (error) {
      console.error('Erro ao abrir anexo:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar abrir o anexo.');
    }
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      {icon}
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Detalhes da Ocorrência</Text>
        
        <View style={styles.card}>
          <InfoRow icon={<Calendar size={24} color="#4b5563" />} label="Data e Hora" value={`${formattedDate} às ${formattedTime}`} />
          <InfoRow icon={<MapPin size={24} color="#4b5563" />} label="Local" value={ocorrencia.local?.nome || 'Não informado'} />
          <InfoRow icon={<User size={24} color="#4b5563" />} label="Responsável pelo Registro" value={ocorrencia.responsavel_registro} />
        </View>

        <View style={styles.card}>
            <InfoRow icon={<FileText size={24} color="#4b5563" />} label="Descrição Completa" value={ocorrencia.descricao} />
        </View>

        {ocorrencia.anexos && ocorrencia.anexos.length > 0 && (
          <View style={styles.card}>
            <InfoRow icon={<Paperclip size={24} color="#4b5563" />} label="Anexos" value="" />
            {ocorrencia.anexos.map((anexo) => (
              <TouchableOpacity key={anexo.id} style={styles.anexoButton} onPress={() => handleOpenAnexo(anexo)}>
                 {anexo.mime_type && anexo.mime_type.startsWith('image/') ? (
                    <Image source={{ uri: `${API_URL}/${anexo.url}` }} style={styles.anexoPreview} />
                  ) : (
                    <View style={styles.anexoIconPlaceholder}>
                      <FileText size={20} color="#3b82f6" />
                    </View>
                  )}
                <Text style={styles.anexoButtonText} numberOfLines={1}>{anexo.url.split('/').pop()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { padding: 20 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  infoTextContainer: { marginLeft: 16, flex: 1 },
  infoLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#1f2937', flexWrap: 'wrap' },
  anexoButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', padding: 12, borderRadius: 8, marginTop: 8 },
  anexoButtonText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 12, flex: 1 },
  anexoPreview: { width: 40, height: 40, borderRadius: 4 },
  anexoIconPlaceholder: { width: 40, height: 40, borderRadius: 4, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
});
