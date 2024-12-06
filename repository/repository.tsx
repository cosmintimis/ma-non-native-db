import { MediaItem, MEDIA_TYPE } from "@/model/mediaItem";
import {
    deleteMediaItemDb,
    fetchMediaItems,
    insertMediaItemDb,
    updateMediaItemDb,
} from "@/utils/db";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useEffect, useRef, useState } from "react";

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
        try {
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
        try {
            const result = await deleteMediaItemDb(db, id);
            if (result < 1) {
                console.error("Error deleting media item from db", id);
                throw new CustomError(
                    "Encountered an error while deleting media item, please try again later"
                );
            }
            const newMediaItems = allMediaItems.current.filter(
                (mediaItem) => mediaItem.id !== id
            );
            allMediaItems.current = newMediaItems;
            handleSearch(lastSearchTerm.current);
        } catch (error) {
            console.error("Error deleting media item", error);
            throw new CustomError(
                "Encountered an error while deleting media item, please try again later"
            );
        }
    };

    const getMediaItemById = (id: string) => {
        return allMediaItems.current.find((mediaItem) => mediaItem.id === id);
    };

    const updateMediaItem = async (mediaItem: MediaItem) => {
        // Update in db first
        try {
            const result = await updateMediaItemDb(db, mediaItem);
            if (result < 1) {
                console.error("Error updating media item in db", mediaItem.id);
                throw new CustomError(
                    "Encountered an error while updating media item, please try again later"
                );
            }
            const newMediaItems = allMediaItems.current.map((item) =>
                item.id === mediaItem.id ? mediaItem : item
            );
            allMediaItems.current = newMediaItems;
            handleSearch(lastSearchTerm.current);
        } catch (error) {
            console.error("Error updating media item", error);
            throw new CustomError(
                "Encountered an error while updating media item, please try again later"
            );
        }
    };

    const addMediaItem = async (mediaItem: MediaItem) => {
        // Add to db first
        try {
            const result = await insertMediaItemDb(db, mediaItem);
            if (result < 1) {
                console.error("Error adding media item to db", mediaItem.id);
                throw new CustomError(
                    "Encountered an error while adding new media item, please try again later"
                );
            }
            const newMediaItems = [...allMediaItems.current, mediaItem];
            allMediaItems.current = newMediaItems;
            handleSearch(lastSearchTerm.current);
        } catch (error) {
            console.error("Error adding media item", error);
            throw new CustomError(
                "Encountered an error while adding new media item, please try again later"
            );
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
