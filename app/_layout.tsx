import { MediaItemsProvider } from "@/repository/repository";
import { Stack } from "expo-router";
import "../global.css";
import { SQLiteProvider} from 'expo-sqlite';
import initDb from "@/utils/db";

export default function RootLayout() {
    return (
        <SQLiteProvider databaseName="DeepFakeGuardian" onInit={initDb}>
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
        </SQLiteProvider>
    );
}
