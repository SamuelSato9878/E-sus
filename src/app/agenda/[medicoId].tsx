import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Calendario from '../../components/Calendario';
import ScreenHeader from '../../components/ScreenHeader';
import { useCalendario } from '../../hooks/useCalendario';
import { useDiasDisponiveis } from '../../hooks/useDiasDisponiveis';
import { useHorariosDisponiveis } from '../../hooks/useHorariosDisponiveis';
import { useMedico } from '../../hooks/useMedico';

export default function AgendaMedico() {
  const { medicoId } = useLocalSearchParams<{ medicoId: string }>();
  const id = Number(medicoId);
  const insets = useSafeAreaInsets();

  const { medico } = useMedico(id);
  const calendario = useCalendario();
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const dias = useDiasDisponiveis(id, calendario.ano, calendario.mes);
  const horarios = useHorariosDisponiveis(id, dataSelecionada);

  // Ao voltar da confirmação, a agenda pode ter mudado (ex.: horário reservado por outra pessoa).
  const { recarregar: recarregarDias } = dias;
  const { recarregar: recarregarHorarios } = horarios;
  useFocusEffect(
    useCallback(() => {
      recarregarDias();
      recarregarHorarios();
    }, [recarregarDias, recarregarHorarios])
  );

  function trocarMes(acao: () => void) {
    setDataSelecionada(null);
    acao();
  }

  function selecionarHorario(hora: string) {
    if (!dataSelecionada) return;
    router.push({
      pathname: '/confirmar-consulta',
      params: { medicoId: String(id), data: dataSelecionada, hora },
    });
  }

  return (
    <View style={styles.container}>
      <ScreenHeader titulo={medico ? `Agendamento - ${medico.nome}` : 'Agendamento'} />

      <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 24 }]}>
        <Calendario
          ano={calendario.ano}
          mes={calendario.mes}
          diasDisponiveis={dias.dias}
          dataSelecionada={dataSelecionada}
          podeVoltar={calendario.podeVoltar}
          onSelecionar={setDataSelecionada}
          onAvancar={() => trocarMes(calendario.avancar)}
          onVoltar={() => trocarMes(calendario.voltar)}
        />

        <Text style={styles.titulo}>HORÁRIOS DISPONÍVEIS</Text>

        {!dataSelecionada ? (
          <Text style={styles.aviso}>
            {dias.loading || dias.dias.length > 0
              ? 'Selecione um dia destacado no calendário.'
              : 'Nenhum dia disponível neste mês. Tente o próximo.'}
          </Text>
        ) : horarios.loading ? (
          <ActivityIndicator color="#2FBDE8" />
        ) : horarios.horarios.length === 0 ? (
          <Text style={styles.aviso}>Não há mais horários livres neste dia.</Text>
        ) : (
          <View style={styles.grade}>
            {horarios.horarios.map((hora) => (
              <View key={hora} style={styles.celula}>
                <Pressable
                  onPress={() => selecionarHorario(hora)}
                  style={({ pressed }) => [styles.horario, pressed && styles.horarioPressed]}
                >
                  <Text style={styles.horarioTexto}>{hora}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  conteudo: { paddingHorizontal: 36, paddingTop: 28 },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 24,
  },
  aviso: { textAlign: 'center', fontSize: 14, color: '#5B6B7F' },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -12,
  },
  celula: {
    width: '33.33%',
    paddingHorizontal: 12,
    marginBottom: 38,
  },
  horario: {
    backgroundColor: '#C9D1DA',
    paddingVertical: 9,
    alignItems: 'center',
  },
  horarioPressed: { backgroundColor: '#1CA8DB' },
  horarioTexto: { fontSize: 17, color: '#111111' },
});
