import { Alert, Platform } from "react-native";

type AlertOption = {
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
};

const alertPolyfill = (
    title: string,
    description: string,
    options: AlertOption[],
    extra?: any
): void => {
    const result = window.confirm(
        [title, description].filter(Boolean).join("\n")
    );

    if (result) {
        const confirmOption = options.find(({ style }) => style !== "cancel");
        confirmOption?.onPress();
    } else {
        const cancelOption = options.find(({ style }) => style === "cancel");
        cancelOption?.onPress();
    }
};

// Determine which alert method to use based on the platform
const alert = Platform.OS === "web" ? alertPolyfill : Alert.alert;

export default alert;
