import { Stack } from "expo-router";

export default function AuthLayout(){
    return(
        <Stack>
            <Stack.Screen name="login"></Stack.Screen>
            <Stack.Screen name="signup" options={{title: "Cadastro"}}></Stack.Screen>
        </Stack>
    )
}