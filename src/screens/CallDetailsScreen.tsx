import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  description: string;
  photoUri?: string | null;
  address?: string | null;
  status: string;
};

export default function CallDetailScreen({ route }: any) {
  const { chamadoId } = route.params;
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function carregarChamado() {
      setLoading(true);
      try {
        const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setChamado(snapshot.data() as Chamado);
        } else {
          Alert.alert('Erro', 'Chamado não encontrado.');
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do chamado.');
      } finally {
        setLoading(false);
      }
    }

    carregarChamado();
  }, [chamadoId]);

  async function mudarStatus(novoStatus: string) {
    setUpdating(true);
    try {
      const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
      await updateDoc(docRef, { status: novoStatus });

      setChamado((prev) => (prev ? { ...prev, status: novoStatus } : null));
      Alert.alert('Sucesso', `Status alterado para "${novoStatus}".`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!chamado) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Chamado não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status Atual:</Text>
        <Text style={styles.statusBadge}>{chamado.status}</Text>
      </View>

      <Text style={styles.sectionTitle}>Descrição</Text>
      <Text style={styles.infoBox}>{chamado.description}</Text>

      {chamado.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          <Text style={styles.infoBox}>{chamado.address}</Text>
        </View>
      )}

      {chamado.photoUri && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto Anexada</Text>
          <Image source={{ uri: chamado.photoUri }} style={styles.photo} />
        </View>
      )}

      <View style={styles.actionsContainer}>
        {chamado.status === 'aberto' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.startButton, updating && styles.disabledButton]}
              disabled={updating}
              onPress={() => mudarStatus('atendendo')}
            >
              <Text style={styles.buttonText}>
                {updating ? 'Aguarde...' : 'Iniciar Atendimento'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton, updating && styles.disabledButton]}
              disabled={updating}
              onPress={() => mudarStatus('cancelado')}
            >
              <Text style={styles.buttonText}>
                {updating ? 'Aguarde...' : 'Cancelar Chamado'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {chamado.status === 'atendendo' && (
          <TouchableOpacity
            style={[styles.button, styles.completeButton, updating && styles.disabledButton]}
            disabled={updating}
            onPress={() => mudarStatus('concluido')}
          >
            <Text style={styles.buttonText}>
              {updating ? 'Aguarde...' : 'Concluir Atendimento'}
            </Text>
          </TouchableOpacity>
        )}

        {(chamado.status === 'concluido' || chamado.status === 'cancelado') && (
          <Text style={styles.finalStateText}>Este chamado já foi finalizado.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: '#d32f2f' },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginRight: 8 },
  statusBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565c0',
    textTransform: 'uppercase',
  },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 6 },
  infoBox: {
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  photo: { width: '100%', height: 220, borderRadius: 8 },
  actionsContainer: { marginTop: 30, gap: 12 },
  button: { borderRadius: 8, padding: 14, alignItems: 'center' },
  startButton: { backgroundColor: '#1565c0' },
  completeButton: { backgroundColor: '#2e7d32' },
  cancelButton: { backgroundColor: '#c62828' },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  finalStateText: { textAlign: 'center', color: '#777', fontStyle: 'italic', marginTop: 10 },
});