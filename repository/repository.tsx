import { MediaItem, MEDIA_TYPE } from "@/model/mediaItem";
import { deleteMediaItemDb, fetchMediaItems, insertMediaItemDb, updateMediaItemDb } from "@/utils/db";
import { loadStoredImage } from "@/utils/generalUtils";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import uuid from "react-native-uuid";

export async function loadInitMediaItems(): Promise<MediaItem[]> {
    const [mediaData1, mediaData2] = await Promise.all([
        loadStoredImage(require("../assets/images/cat1.jpg")),
        loadStoredImage(require("../assets/images/cat2.jpg")),
    ]);

    const mediaItems: MediaItem[] = [
        {
            id: uuid.v4(),
            title: "Cat1",
            description: "description 1",
            location: "Borsa Maramures",
            type: MEDIA_TYPE.IMAGE,
            mimeType: "image/jpeg",
            size: mediaData1.length,
            mediaData: mediaData1,
            tags: ["grey", "majestic"],
        },
        {
            id: uuid.v4(),
            title: "Cat2",
            description: "description 2",
            location: "Cluj-Napoca Cluj",
            type: MEDIA_TYPE.IMAGE,
            mimeType: "image/jpeg",
            size: mediaData2.length,
            mediaData: mediaData2,
            tags: ["orange", "grey"],
        },
    ];
    return mediaItems;
}

type MediaItemContextType = {
    mediaItems: MediaItem[];
    setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    handleSearch: (searchTerm: string) => void;
    deleteMediaItem: (id: string) => Promise<void>;
    getMediaItemById: (id: string) => MediaItem | undefined;
    updateMediaItem: (mediaItem: MediaItem) => Promise<void>;
    addMediaItem: (mediaItem: MediaItem) => Promise<void>;
};

export const MediaItemContext = createContext<MediaItemContextType>({
    mediaItems: [],
    setMediaItems: () => {},
    handleSearch: () => {},
    deleteMediaItem: async () => {},
    getMediaItemById: () => undefined,
    updateMediaItem: async () => {},
    addMediaItem: async () => {},
});

export const MediaItemsProvider = ({ children }: any) => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const allMediaItems = useRef<MediaItem[]>([]);
    const lastSearchTerm = useRef<string>("");
    const db = useSQLiteContext();

    const loadInit = async () => {
        try{
            const mediaItems = await fetchMediaItems(db);
            setMediaItems(mediaItems);
            allMediaItems.current = mediaItems;
        } catch (error) {
            console.error("Error loading media items", error);
        }
    };

    useEffect(() => {
        loadInit();
    }, []);

    const handleSearch = (searchTerm: string) => {
        lastSearchTerm.current = searchTerm;
        if (searchTerm === "") {
            setMediaItems(allMediaItems.current);
            return;
        }

        const filteredMediaItems = allMediaItems.current.filter((mediaItem) =>
            mediaItem.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setMediaItems(filteredMediaItems);
    };

    const deleteMediaItem = async (id: string) => {
        // Remove from db first
        try{
            const result = await deleteMediaItemDb(db, id);
            if(result < 1) {
                console.error("Error deleting media item from db", id);
                return;
            }
            const newMediaItems = allMediaItems.current.filter(
                (mediaItem) => mediaItem.id !== id
            );
            allMediaItems.current = newMediaItems;
            handleSearch(lastSearchTerm.current);
        } catch (error) {
            console.error("Error deleting media item", error);
        }
    };

    const getMediaItemById = (id: string) => {
        return allMediaItems.current.find((mediaItem) => mediaItem.id === id);
    };

    const updateMediaItem = async (mediaItem: MediaItem) => {
        // Update in db first
        try{
            const result = await updateMediaItemDb(db, mediaItem);
            if(result < 1) {
                console.error("Error updating media item in db", mediaItem);
                return;
            }
            const newMediaItems = allMediaItems.current.map((item) =>
                item.id === mediaItem.id ? mediaItem : item
            );
            allMediaItems.current = newMediaItems;
            handleSearch(lastSearchTerm.current);
        }catch (error) {
            console.error("Error updating media item", error);
        }
    };

    const addMediaItem = async (mediaItem: MediaItem) => {
        // Add to db first
       try{
        const result = await insertMediaItemDb(db, mediaItem);
        if(result < 1) {
            console.error("Error adding media item to db", mediaItem);
            return;
        }
        const newMediaItems = [...allMediaItems.current, mediaItem];
        allMediaItems.current = newMediaItems;
        handleSearch(lastSearchTerm.current);
       }catch (error) {
              console.error("Error adding media item", error);
        }
    };

    return (
        <MediaItemContext.Provider
            value={{
                mediaItems,
                setMediaItems,
                handleSearch,
                deleteMediaItem,
                getMediaItemById,
                updateMediaItem,
                addMediaItem,
            }}
        >
            {children}
        </MediaItemContext.Provider>
    );
};

export const useMediaItemsStore = () => {
    return useContext(MediaItemContext);
};
