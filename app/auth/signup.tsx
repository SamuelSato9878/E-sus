import { View, Text } from "react-native";
import { Input } from "../components/input";
import { Screen } from "../components/screen";
import { Button } from "../components/button";
import { Link } from "expo-router";

export default function SignUp(){
    
    return(
        <Screen>
            <View className="flex-1 pl-3">

                <View className="">
                    <Text className="text-xl font-bold mb-2">Nome Completo</Text>
                    <Input placeholder="Digite seu nome"></Input>

                    <Text className="text-xl font-bold mt-8 mb-2">E-mail</Text>
                    <Input placeholder="Seu@email.com"></Input>

                    <Text className="text-xl font-bold mt-8 mb-2">Telefone</Text>
                    <Input placeholder="(00) 00000-0000"></Input>

                    <Text className="text-xl font-bold mt-8 mb-2">Senha</Text>
                    <Input placeholder="Crie sua Senha" secureTextEntry></Input>

                    <Text className="text- mt-8 mb-8">Li e aceito os Termos de Uso e Politica de Privacidade</Text>
                    <Button className="bg-black" label="Cadastrar" ></Button>
                </View>

                <Text className="text-center mt-[30%]">Já tem uma conta?
                    <Link className="text-[#087F8C]" href={"/tabs/home"}> Entrar na aplicação</Link>
                </Text>
            </View>
        </Screen>
    )
}