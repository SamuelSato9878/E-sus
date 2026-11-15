import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { buscarDias, buscarJanelas, listarProfissionais, listarServicos } from '../../services/pacienteApi';

function isoDay(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function localTime(value: string) { return new Date(value).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }); }
function withinWindow(date: string, time: string, windows: { start_at: string; end_at: string }[]) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const instant = new Date(`${date}T${time}:00-03:00`).getTime();
  return windows.some((window) => instant >= new Date(window.start_at).getTime() && instant <= new Date(window.end_at).getTime());
}

export default function AgendaProfissional() {
  const params = useLocalSearchParams<{ medicoId: string; serviceId: string; appointmentId?: string }>();
  const professionalId = Number(params.medicoId);
  const serviceId = Number(params.serviceId);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeOverride, setTimeOverride] = useState<string | null>(null);
  const start = isoDay(month);
  const end = isoDay(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const { data: days, loading: daysLoading, error: daysError, recarregar: reloadDays } = useAsyncData(() => buscarDias(professionalId, serviceId, start, end), [professionalId, serviceId, start, end]);
  const { data: windows, loading: windowsLoading, error: windowsError } = useAsyncData(() => selectedDate ? buscarJanelas(professionalId, serviceId, selectedDate) : Promise.resolve([]), [professionalId, serviceId, selectedDate]);
  const { data: professionals } = useAsyncData(listarProfissionais, []);
  const { data: services } = useAsyncData(listarServicos, []);
  const professional = professionals?.find((item) => item.id === professionalId);
  const service = services?.find((item) => item.id === serviceId);
  const dates = days ?? [];
  const time = timeOverride ?? (windows?.[0] ? localTime(windows[0].start_at) : '');

  const titleMonth = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const validTime = selectedDate ? withinWindow(selectedDate, time, windows ?? []) : false;

  return <View style={styles.container}>
    <ScreenHeader titulo={`Agenda - ${professional?.name ?? 'profissional'}`} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.service}>{service?.name ?? 'Consulta'}</Text>
      <View style={styles.monthRow}>
        <Pressable onPress={() => { setSelectedDate(null); setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); }}><Text style={styles.arrow}>‹</Text></Pressable>
        <Text style={styles.month}>{titleMonth}</Text>
        <Pressable onPress={() => { setSelectedDate(null); setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); }}><Text style={styles.arrow}>›</Text></Pressable>
      </View>
      {daysLoading ? <ActivityIndicator color="#1CA8DB" /> : daysError ? <Text style={styles.message}>{daysError} Verifique sua conexão.</Text> : dates.length ? <View style={styles.dateGrid}>{dates.map((date) => <Pressable key={date} onPress={() => { setSelectedDate(date); setTimeOverride(null); }} style={[styles.dateButton, date === selectedDate && styles.dateSelected]}><Text style={[styles.dateText, date === selectedDate && styles.selectedText]}>{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text></Pressable>)}</View> : <Text style={styles.message}>Não há dias disponíveis neste mês.</Text>}
      {selectedDate && <View style={styles.timeSection}>
        <Text style={styles.label}>Escolha um horário dentro de uma janela disponível</Text>
        {windowsLoading ? <ActivityIndicator color="#1CA8DB" /> : windowsError ? <Text style={styles.message}>{windowsError}</Text> : windows?.length ? <>
          {windows.map((window, index) => <Text key={index} style={styles.window}>{localTime(window.start_at)} até {localTime(window.end_at)} · horários de início</Text>)}
          <TextInput style={styles.timeInput} value={time} onChangeText={setTimeOverride} keyboardType="numbers-and-punctuation" placeholder="HH:MM" maxLength={5} />
          {!!time && !validTime && <Text style={styles.error}>Escolha um horário entre os limites indicados.</Text>}
        </> : <Text style={styles.message}>Esta data acabou de ficar sem horários disponíveis.</Text>}
      </View>}
      <Pressable disabled={!validTime || daysLoading || windowsLoading} onPress={() => selectedDate && router.push({ pathname: '/confirmar-consulta', params: { medicoId: String(professionalId), serviceId: String(serviceId), data: selectedDate, hora: time, appointmentId: params.appointmentId ?? '' } })} style={[styles.confirm, (!validTime || daysLoading || windowsLoading) && styles.disabled]}><Text style={styles.confirmText}>{params.appointmentId ? 'Confirmar remarcação' : 'Continuar'}</Text></Pressable>
      <Pressable onPress={reloadDays} style={styles.refresh}><Text style={styles.refreshText}>Atualizar disponibilidade</Text></Pressable>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, content: { padding: 20, paddingBottom: 36 }, service: { fontSize: 17, fontWeight: '700', color: '#17212B', marginBottom: 18 }, monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, month: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize', color: '#17212B' }, arrow: { fontSize: 32, paddingHorizontal: 12, color: '#0866A3' }, dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, dateButton: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#B7C6D4', borderRadius: 8 }, dateSelected: { backgroundColor: '#1CA8DB', borderColor: '#1CA8DB' }, dateText: { color: '#17212B' }, selectedText: { color: '#fff', fontWeight: '700' }, timeSection: { marginTop: 24, gap: 10 }, label: { fontWeight: '700', color: '#17212B' }, window: { color: '#536579' }, timeInput: { borderBottomWidth: 1, borderColor: '#8292A5', width: 100, paddingVertical: 10, fontSize: 20, color: '#17212B' }, message: { color: '#536579', textAlign: 'center', marginVertical: 18 }, error: { color: '#B3261E' }, confirm: { marginTop: 28, padding: 15, backgroundColor: '#1CA8DB', borderRadius: 10, alignItems: 'center' }, confirmText: { color: '#fff', fontWeight: '700', fontSize: 16 }, disabled: { opacity: 0.45 }, refresh: { alignItems: 'center', padding: 12 }, refreshText: { color: '#0866A3' } });
