import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMediaItemsStore } from "@/repository/repository";
import { useLocalSearchParams } from "expo-router";
import alert from "@/utils/alertPolyfill";
import { MediaItem } from "@/model/mediaItem";
import Icon from "react-native-vector-icons/Ionicons";

export default function UpdateMediaItemView() {
    const navigation = useNavigation();
    const { getMediaItemById, updateMediaItem } = useMediaItemsStore();
    const { mediaItemId } = useLocalSearchParams<{ mediaItemId: string }>();
    const mediaItem = getMediaItemById(mediaItemId);

    if (!mediaItem) {
        alert("Error", "Media item ID is missing", [
            {
                text: "OK",
                onPress: () => navigation.goBack(),
            },
            {
                text: "Cancel",
                onPress: () => navigation.goBack(),
                style: "cancel",
            },
        ]);
    }

    const [title, setTitle] = useState(mediaItem!.title);
    const [description, setDescription] = useState(mediaItem!.description);
    const [location, setLocation] = useState(mediaItem!.location);
    const mediaItemTagsAsString = mediaItem!.tags.join(", ");
    const [tags, setTags] = useState(mediaItemTagsAsString);
    const [disableButton, setDisableButton] = useState(false);

    const handleUpdate = () => {
        if (isFormValid && !disableButton) {
            const prepareData: MediaItem = {
                ...mediaItem!,
                title,
                description,
                location,
                tags: tags.split(",").map((tag) => tag.trim()),
            };
            try {
                setDisableButton(true);
                updateMediaItem(prepareData);
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
        tags.length > 0;

    return (
        <SafeAreaView className="flex flex-col w-full p-4 !gap-4">
            <View className="flex flex-row items-center !mb-8">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="black" />
                </TouchableOpacity>
                <Text className="w-full text-center !text-3xl font-bold">
                    Edit selected media
                </Text>
            </View>

            <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                    Title
                </Text>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Title"
                    className="border border-gray-300 rounded p-3 text-base"
                />
            </View>
            <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                    Description
                </Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description"
                    className="border border-gray-300 rounded p-3 text-base"
                />
            </View>
            <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                    Location
                </Text>
                <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Location"
                    className="border border-gray-300 rounded p-3 text-base"
                />
            </View>
            <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                    Tags (keep them separated by commas)
                </Text>
                <TextInput
                    value={tags}
                    onChangeText={setTags}
                    placeholder="Tags (use comma to separate)"
                    className="border border-gray-300 rounded p-3 text-base"
                />
            </View>

            <View className="flex-row justify-end mt-4">
                <TouchableOpacity
                    onPress={handleUpdate}
                    className="bg-black py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isFormValid || disableButton}
                >
                    <Text className="text-white text-center">Save</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
