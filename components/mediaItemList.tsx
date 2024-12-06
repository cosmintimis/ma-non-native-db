import { useMediaItemsStore } from "@/repository/repository";
import { FlatList, View } from "react-native";
import { MediaItemCard } from "./mediaItemCard";

export const MediaItemList = () => {
    const { mediaItems } = useMediaItemsStore();
    return (
      <View className="flex-1">
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            data={mediaItems}
            renderItem={({ item }) => <MediaItemCard mediaItem={item} />}
            keyExtractor={(item) => item.id}
            ListFooterComponent={<View className="h-20" />}
        />
      </View>
    );
};
