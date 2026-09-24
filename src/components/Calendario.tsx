import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { diasNoMes, montarISODate, NOMES_MESES } from '../utils/datas';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type Props = {
  ano: number;
  mes: number; // 0-11
  diasDisponiveis: string[];
  dataSelecionada: string | null;
  podeVoltar: boolean;
  onSelecionar: (data: string) => void;
  onAvancar: () => void;
  onVoltar: () => void;
};

/** Calendário mensal (semana começando na segunda) que só deixa tocar nos dias disponíveis. */
export default function Calendario({
  ano,
  mes,
  diasDisponiveis,
  dataSelecionada,
  podeVoltar,
  onSelecionar,
  onAvancar,
  onVoltar,
}: Props) {
  const disponiveis = new Set(diasDisponiveis);
  const vaziosAntes = (new Date(ano, mes, 1).getDay() + 6) % 7;
  const totalDias = diasNoMes(ano, mes);
  const totalCelulas = Math.ceil((vaziosAntes + totalDias) / 7) * 7;

  const celulas = Array.from({ length: totalCelulas }, (_, i) => {
    const dia = i - vaziosAntes + 1;
    return dia >= 1 && dia <= totalDias ? dia : null;
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={onVoltar} disabled={!podeVoltar} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={podeVoltar ? '#1F3B6E' : '#C5CEDA'} />
        </Pressable>
        <Text style={styles.mes}>
          {NOMES_MESES[mes].toUpperCase()} {ano}
        </Text>
        <Pressable onPress={onAvancar} hitSlop={10}>
          <Ionicons name="chevron-forward" size={22} color="#1F3B6E" />
        </Pressable>
      </View>

      <View style={styles.grade}>
        {DIAS_SEMANA.map((d) => (
          <Text key={d} style={styles.diaSemana}>
            {d}
          </Text>
        ))}

        {celulas.map((dia, i) => {
          if (dia === null) {
            return (
              <View key={`vazio-${i}`} style={styles.celula}>
                <View style={[styles.dia, styles.diaVazio]} />
              </View>
            );
          }

          const data = montarISODate(ano, mes, dia);
          const disponivel = disponiveis.has(data);
          const selecionado = data === dataSelecionada;

          return (
            <View key={data} style={styles.celula}>
              <Pressable
                disabled={!disponivel}
                onPress={() => onSelecionar(data)}
                style={[
                  styles.dia,
                  disponivel && styles.diaDisponivel,
                  selecionado && styles.diaSelecionado,
                ]}
              >
                <Text
                  style={[
                    styles.diaTexto,
                    !disponivel && styles.diaTextoIndisponivel,
                    selecionado && styles.diaTextoSelecionado,
                  ]}
                >
                  {dia}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.legenda}>
        <View style={styles.legendaCor} />
        <Text style={styles.legendaTexto}>Dias com horário disponível</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E6E9EF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  mes: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F3B6E',
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  diaSemana: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    color: '#5B6B7F',
    marginBottom: 6,
  },
  celula: {
    width: `${100 / 7}%`,
    padding: 2,
  },
  dia: {
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E6E9EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaVazio: {
    backgroundColor: '#F4F6F9',
  },
  diaDisponivel: {
    backgroundColor: '#CFE3FB',
    borderColor: '#CFE3FB',
  },
  diaSelecionado: {
    backgroundColor: '#1CA8DB',
    borderColor: '#1CA8DB',
  },
  diaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F3B6E',
  },
  diaTextoIndisponivel: {
    color: '#9AA6B5',
    fontWeight: '400',
  },
  diaTextoSelecionado: {
    color: '#FFFFFF',
  },
  legenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F6FD',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  legendaCor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#CFE3FB',
    borderWidth: 1,
    borderColor: '#A8CCF7',
  },
  legendaTexto: {
    fontSize: 10,
    color: '#1F3B6E',
  },
});
