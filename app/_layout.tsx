import { MediaItemsProvider } from "@/repository/repository";
import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
    return (
        <MediaItemsProvider>
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="addMediaItemView/index"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="updateMediaItemView/[mediaItemId]"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </MediaItemsProvider>
    );
}
