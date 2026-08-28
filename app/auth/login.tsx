import { View, Text } from "react-native";
import { Input } from "../components/input";
import { Screen } from "../components/screen";
import { Button } from "../components/button";
import { Link } from "expo-router";

export default function Login(){
    
    return(
        <Screen>
            <View className="flex-1 justify-center p-8 mt-[30%]">
                <Text className="text-5xl font-bold">Bem vindo(a)!</Text>
                <Text className="text-xl mt-1">Faça login para continuar</Text>

                <View className="mt-8">
                    <Text className="text-xl font-bold">E-mail</Text>
                    <Input placeholder="Seu@email.com"></Input>

                    <Text className="text-xl font-bold mt-8">Senha</Text>
                    <Input placeholder="Digite sua senha" secureTextEntry></Input>

                    <Text className="mt-8 mb-8 text-[#087F8C]">Esqueceu sua Senha?</Text>

                    <Button label="Entrar" ></Button>
                </View>

                <Text className="text-center mt-[40%]">Não tem uma conta? 
                    <Link className="text-[#087F8C]" href={"/auth/signup"}> Cadastre-se</Link>
                </Text>
            </View>
        </Screen>







        /* <SafeAreaView>
           <KeyboardAvoidingView style={{ flex: 1}} behavior={Platform.select({ios:"padding", android:"height"})}>
                <ScrollView
                contentContainerStyle={{ flexGrow: 1}}
                keyboardShouldPersistTaps='handled'
                className="bg-white"
                >
                    <View className="flex-1 justify-center p-8">
                        <Text className="text-5xl font-bold">Bem vindo(a)!</Text>
                        <Text className="text-xl mt-1">Faça login para continuar</Text>

                        <View>
                            <Text className="text-xl font-bold mt-8">E-mail</Text>
                            <Input placeholder="Seu@email.com"></Input>

                            <Text className="text-xl font-bold mt-8">Senha</Text>
                            <Input placeholder="Digite sua senha" secureTextEntry></Input>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView> 
        </SafeAreaView>  */
    )
}