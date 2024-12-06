import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { Asset } from "expo-asset";

export async function loadImageAsUint8Array(
    filePath: string
): Promise<Uint8Array> {
    try {
        let base64String: string;
        if (Platform.OS === "web") {
            const response = await fetch(filePath);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const byteArray = new Uint8Array(arrayBuffer);
            return byteArray;
        } else {
            base64String = await FileSystem.readAsStringAsync(filePath, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const binaryString = atob(base64String);
            const byteArray = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                byteArray[i] = binaryString.charCodeAt(i);
            }
            return byteArray;
        }
    } catch (error) {
        console.error("Error loading image:", error);
        throw error;
    }
}
export async function loadStoredImage(
    assetModule: number
): Promise<Uint8Array> {
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();

    return loadImageAsUint8Array(asset.localUri!);
}

export const convertUriToByteArray = async (uri: string): Promise<Uint8Array | undefined> => {
  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer(); 
    const byteArray = new Uint8Array(arrayBuffer); 
    return byteArray; 
  } catch (error) {
    console.error('Error converting URI to byte array', error);
    return undefined; 
  }
};
