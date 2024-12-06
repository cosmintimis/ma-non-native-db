import { MEDIA_TYPE, MediaItem } from "@/model/mediaItem";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useMediaItemsStore } from "@/repository/repository";
import { Buffer } from "buffer";
import alert from "@/utils/alertPolyfill";
import { useNavigation } from "expo-router";

export const MediaItemCard = ({ mediaItem }: { mediaItem: MediaItem }) => {
    const { deleteMediaItem } = useMediaItemsStore();
    const navigation = useNavigation<any>();

    const handleUpdate = () => {
        navigation.navigate("updateMediaItemView/[mediaItemId]", {
            mediaItemId: mediaItem.id,
        });
    };

    const handleDelete = () => {
        alert(
            "Delete Confirmation",
            "Are you sure you want to delete this media?",
            [
                {
                    text: "Cancel",
                    onPress: () => {},
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => {
                        console.log(`Deleting media with ID: ${mediaItem.id}`);
                        try {
                            deleteMediaItem(mediaItem.id);
                        } catch (e) {
                            console.error(e);
                        }
                    },
                },
            ]
        );
    };

    const defaultImage = require("../assets/images/no_picture.jpg");
    const imageBase64 = `data:${mediaItem.mimeType};base64,${Buffer.from(
        mediaItem.mediaData
    ).toString("base64")}`;

    return (
        <View className="flex flex-col mx-4 my-2 p-4 bg-white rounded-xl shadow-lg">
            {mediaItem.mediaData && mediaItem.type === MEDIA_TYPE.IMAGE ? (
                <Image
                    source={{
                        uri: imageBase64,
                    }}
                    resizeMode="contain"
                    className="mb-4"
                    style={{ width: "100%", height: 200 }}
                />
            ) : (
                <Image
                    source={defaultImage}
                    resizeMode="contain"
                    className="mb-4"
                    style={{ width: "100%", height: 200 }}
                />
            )}

            <Text className="text-xl font-bold mb-1 text-red-500">
                {mediaItem.title}
            </Text>
            <Text className="text-sm mb-2">{mediaItem.description}</Text>

            <View className="flex-row flex-wrap mb-4">
                {mediaItem.tags.map((tag, index) => (
                    <Text key={index} className="text-sm italic mr-2">
                        {tag}
                    </Text>
                ))}
            </View>
            <View className="flex flex-row justify-between items-center">
                <Text className="text-sm italic truncate max-w-[60%] flex-shrink">
                    📍 {mediaItem.location}
                </Text>

                <View className="flex flex-row !gap-4">
                    <TouchableOpacity
                        onPress={handleUpdate}
                        className="bg-black py-2 px-4 rounded-md shadow-md"
                    >
                        <Text className="text-white text-center">Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDelete}
                        className=" bg-black py-2 px-4 rounded-md shadow-md"
                    >
                        <Text className="text-white text-center">Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
