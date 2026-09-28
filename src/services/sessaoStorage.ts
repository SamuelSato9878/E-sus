import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN = '@e_sus/access_token';
const REFRESH_TOKEN = '@e_sus/refresh_token';

export async function salvarSessao(
  accessToken: string,
  refreshToken: string
) {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN, accessToken],
    [REFRESH_TOKEN, refreshToken],
  ]);
}

export async function tokenAtual() {
  return AsyncStorage.getItem(ACCESS_TOKEN);
}

export async function limparSessao() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN,
    REFRESH_TOKEN,
  ]);
}