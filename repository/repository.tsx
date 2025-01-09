import {
    createMediaItem,
    getMediaItems,
    removeMediaItem,
    updateMedia,
} from "@/api/media";
import { MediaItem } from "@/model/mediaItem";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type MediaItemContextType = {
    mediaItems: MediaItem[];
    setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    handleSearch: (searchTerm: string) => void;
    deleteMediaItem: (id: string) => Promise<void>;
    getMediaItemById: (id: string) => MediaItem | undefined;
    updateMediaItem: (mediaItem: MediaItem) => Promise<void>;
    addMediaItem: (mediaItem: Omit<MediaItem, "id">) => Promise<void>;
};

type WebSocketMessage = {
    type: string;
};
export const WEBSOCKET_MESSAGE_TYPE = {
    MEDIA_UPDATED: "media_updated",
} as const;
export type WEBSOCKET_MESSAGE_TYPE = (typeof WEBSOCKET_MESSAGE_TYPE)[keyof typeof WEBSOCKET_MESSAGE_TYPE];

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
    const [serverStatus, setServerStatus] = useState("Offline");

    const fetchMediaItems = async () => {
        try {
            const mediaItems: MediaItem[] = await getMediaItems();
            setMediaItems(mediaItems);
            allMediaItems.current = mediaItems;
            handleSearch(lastSearchTerm.current);
        } catch (error) {
            console.error(
                "Error loading media items",
                JSON.stringify(error, null, 2)
            );
        }
    };

    useEffect(() => {
        fetchMediaItems();
    }, []);

    // Check server status every 5 seconds
    // useEffect(() => {
    //     const interval = setInterval(async () => {
    //         try {
    //             await fetch("http://192.168.0.169:9090/api/health-check/v1/status");
    //             if (serverStatus === "Offline") {
    //                 setServerStatus("Online");
    //             }
    //         } catch (error) {
    //             setServerStatus("Offline");
    //         }
    //     }, 5000);
    //     return () => clearInterval(interval);
    // }, [serverStatus]);

    useEffect(() => {
        const socket = new WebSocket('ws://192.168.0.169:9090/ws');
        socket.onopen = () => {
          console.log('open');
        };
        socket.onmessage = (e: MessageEvent) => {
            const message: WebSocketMessage = JSON.parse(e.data);
            if (message.type === WEBSOCKET_MESSAGE_TYPE.MEDIA_UPDATED) {
                fetchMediaItems();
            }
        }
        socket.onclose = () => {
          console.log('close');
        }
    }, [serverStatus]);

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
        try {
            await removeMediaItem(id);
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
        try {
            await updateMedia({
                ...mediaItem,
                tags: mediaItem.tags.join(","),
            });
        } catch (error) {
            console.error("Error updating media item", error);
            throw new CustomError(
                "Encountered an error while updating media item, please try again later"
            );
        }
    };

    const addMediaItem = async (mediaItem: Omit<MediaItem, "id">) => {
        try {
            await createMediaItem({
                ...mediaItem,
                tags: mediaItem.tags.join(","),
            });
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
