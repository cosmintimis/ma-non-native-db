import { MediaItemList } from "@/components/mediaItemList";
import toastConfig from "@/components/toastConfig";
import { SERVER_STATUS_TYPE, useMediaItemsStore } from "@/repository/repository";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
    NativeSyntheticEvent,
    SafeAreaView,
    TextInputFocusEventData,
    TouchableOpacity,
    View,
    Text
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";

export default function Index() {
    const navigation = useNavigation<any>();
    const { handleSearch, serverStatus } = useMediaItemsStore();
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Media Collection",
            headerShown: true,
            hideWhenScrolling: false,
            headerSearchBarOptions: {
                placeholder: "Search",
                onChangeText: (
                    text: NativeSyntheticEvent<TextInputFocusEventData>
                ) => {
                    handleSearch(text.nativeEvent.text);
                },
            },
        });
    }, [navigation]);
    return (
        <SafeAreaView className="w-full h-full">
             {serverStatus === SERVER_STATUS_TYPE.OFFLINE && (
                <View className="p-3 w-full z-20">
                    <Text className="text-center text-red-500">API server is offline...</Text>
                </View>
            )}
            <MediaItemList />
            <View className="absolute bottom-0 right-0 p-4 z-10">
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("addMediaItemView/index")
                    }
                    className="bg-black py-3 px-4 rounded-xl shadow-lg"
                >
                    <Icon name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>
            <Toast config={toastConfig} />
        </SafeAreaView>
    );
}
