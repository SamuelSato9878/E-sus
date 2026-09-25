import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OpcaoPerfil from '../../components/OpcaoPerfil';
import { useSessao } from '../../context/SessaoContext';
import { nomeDeExibicao } from '../../utils/usuario';

const AZUL_CABECALHO = '#2FBEE8';
const AZUL_PAINEL = '#B8E8F7';
const TAMANHO_ICONE = 32;

// "Retorno", "Informações" e "Dados" ainda não têm tela definida;
// por enquanto esses cards são só visuais.
export default function Perfil() {
  const { usuario } = useSessao();
  const insets = useSafeAreaInsets();
  const alturaTabBar = useBottomTabBarHeight();

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + 22 }]}>
        <Text style={styles.saudacao} numberOfLines={1}>
          Bem Vindo, {nomeDeExibicao(usuario) ?? '[nome]'}
        </Text>
      </View>

      <View style={[styles.painel, { paddingBottom: alturaTabBar }]}>
        <View style={styles.linha}>
          <OpcaoPerfil
            label={'Meus\nAgendamentos'}
            compacto
            icone={<Ionicons name="time-outline" size={TAMANHO_ICONE} color="#000000" />}
            onPress={() => router.navigate('/agendamentos')}
          />
          <OpcaoPerfil
            label="Retorno"
            icone={
              <MaterialCommunityIcons
                name="clipboard-edit-outline"
                size={TAMANHO_ICONE}
                color="#000000"
              />
            }
          />
        </View>
        <View style={styles.linha}>
          <OpcaoPerfil
            label="Informações"
            icone={
              <Ionicons name="information-circle-outline" size={TAMANHO_ICONE} color="#000000" />
            }
          />
          <OpcaoPerfil
            label="Dados"
            icone={<Ionicons name="person" size={TAMANHO_ICONE} color="#000000" />}
          />
        </View>
      </View>

      {/* Fica por cima do cabeçalho e do painel, como no mockup. */}
      <View style={[styles.avatar, { top: insets.top + 5 }]}>
        <Ionicons name="person" size={52} color={AZUL_PAINEL} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AZUL_CABECALHO,
  },
  cabecalho: {
    paddingLeft: 18,
    // Deixa espaço para o avatar à direita.
    paddingRight: 110,
    paddingBottom: 18,
  },
  saudacao: {
    fontSize: 19,
    fontWeight: '700',
    color: '#EAF8FD',
  },
  painel: {
    flex: 1,
    backgroundColor: AZUL_PAINEL,
    borderTopLeftRadius: 56,
    borderTopRightRadius: 40,
    paddingTop: 110,
    paddingHorizontal: 50,
    gap: 40,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatar: {
    position: 'absolute',
    right: 18,
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#49688D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
