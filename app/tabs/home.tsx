import { View, Text } from "react-native";

import { Screen } from "../components/screen";


export default function HomeScreen(){
    
    return(

        <Screen>
            <View className="flex-1 justify-center mt-[100%] mb-[100%]">
                <Text className="text-center">Homescreen</Text>
            </View>
        </Screen>
        
            
    )
}