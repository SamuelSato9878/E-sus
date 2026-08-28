import { Text, TouchableOpacity, TouchableOpacityProps} from "react-native"

type ButtonProps = TouchableOpacityProps & {
    label: string
}

export function Button( {label, ...rest}: ButtonProps){
    return(
        <TouchableOpacity 
        {...rest}
        className="w-full h-16 bg-[#087F8C] items-center justify-center rounded-lg"
        >
            <Text className="text-white text-2xl font-bold">{label}</Text>
        </TouchableOpacity>
    )
}