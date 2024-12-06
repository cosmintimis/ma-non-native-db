import React, { useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Image
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { MediaItem } from "@/model/mediaItem";
import uuid from "react-native-uuid";
import { convertUriToByteArray } from "@/utils/generalUtils";
import { useMediaItemsStore } from "@/repository/repository";

export default function AddMediaItemView() {
    const navigation = useNavigation();
    const {addMediaItem} = useMediaItemsStore();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [tags, setTags] = useState("");
    const [disableButton, setDisableButton] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const imageMimeType = useRef<string | null>(null);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            // allowsEditing: true,
            // aspect: [4, 3],
            // quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            imageMimeType.current = result.assets[0].mimeType ?? null;
        }
    };

    const handleCreate = async () => {
        if (isFormValid && !disableButton) {
            const uploadedImageByteArray = await convertUriToByteArray(imageUri);
            if (!uploadedImageByteArray) {
                console.error("Error converting image to byte array");
                return;
            }
            const prepareData: MediaItem = {
                title,
                description,
                location,
                tags: tags.split(",").map((tag) => tag.trim()),
                id: uuid.v4(),
                type: "IMAGE", // only image type is supported
                mimeType: imageMimeType.current ?? "image/jpeg",
                size: uploadedImageByteArray.length,
                mediaData: uploadedImageByteArray,
            };
            try {
                setDisableButton(true);
                addMediaItem(prepareData);
            } catch (e) {
                console.error(e);
            } finally {
                navigation.goBack();
            }
        }
    };

    const isFormValid =
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        location.trim().length > 0 &&
        tags.length > 0 &&
        imageUri !== null;

    return (
        <SafeAreaView className="flex flex-col w-full p-4 !gap-4">
            <View className="flex flex-row items-center !mb-8">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="black" />
                </TouchableOpacity>
                <Text className="w-full text-center !text-3xl font-bold">
                    Add new media
                </Text>
            </View>

            <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                className="border border-gray-300 rounded p-3 text-base"
            />
            <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                className="border border-gray-300 rounded p-3 text-base"
            />
            <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
                className="border border-gray-300 rounded p-3 text-base"
            />
            <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="Tags (use comma to separate)"
                className="border border-gray-300 rounded p-3 text-base"
            />

            <View className="flex flex-row items-center justify-between p-4">
                <TouchableOpacity
                    onPress={pickImage}
                    className="flex flex-row items-center bg-black py-2 px-4 rounded-xl shadow-lg !gap-2"
                >
                    <Ionicons
                        name="cloud-upload-outline"
                        size={24}
                        color="white"
                    />
                    <Text className=" text-white">
                        Click to upload a media file
                    </Text>
                </TouchableOpacity>

                {imageUri && (
                    <Image
                        source={{ uri: imageUri }}
                        style={{
                            width: 80,
                            height: 64,
                            borderRadius: 8,
                            marginLeft: 8,
                        }}
                        resizeMode="contain"
                    />
                )}
            </View>

            <View className="flex-row justify-end mt-4">
                <TouchableOpacity
                    onPress={handleCreate}
                    className="bg-black py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isFormValid || disableButton}
                >
                    <Text className="text-white text-center">Add</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
