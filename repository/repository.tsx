import {
    createMediaItem,
    getMediaItems,
    removeMediaItem,
    updateMedia,
} from "@/api/media";
import { MediaItem } from "@/model/mediaItem";
import { fetchV2 } from "@/utils/generalUtils";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type MediaItemContextType = {
    mediaItems: MediaItem[];
    serverStatus: SERVER_STATUS_TYPE;
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

export const SERVER_STATUS_TYPE = {
    ONLINE: "Online",
    OFFLINE: "Offline",
} as const;
export type SERVER_STATUS_TYPE = (typeof SERVER_STATUS_TYPE)[keyof typeof SERVER_STATUS_TYPE];

export const MediaItemContext = createContext<MediaItemContextType>({
    mediaItems: [],
    serverStatus: SERVER_STATUS_TYPE.ONLINE,
    setMediaItems: () => {},
    handleSearch: () => {},
    deleteMediaItem: async () => {},
    getMediaItemById: () => undefined,
    updateMediaItem: async () => {},
    addMediaItem: async () => {},
});

let mediaItemsThatNeedToBeUpdated = [] as MediaItem[];
let mediaItemsThatNeedToBeDeleted = [] as string[];

export const MediaItemsProvider = ({ children }: any) => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const allMediaItems = useRef<MediaItem[]>([]);
    const lastSearchTerm = useRef<string>("");
    const [serverStatus, setServerStatus] = useState<SERVER_STATUS_TYPE>(SERVER_STATUS_TYPE.ONLINE);
    const [socket, setSocket] = useState<WebSocket | null>(null);

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
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                console.log("Checking server status");
                await fetchV2("http://192.168.0.169:9090/api/health-check/v1/status", {
                    timeout: 3000 // 3 seconds
                });
                if (serverStatus === SERVER_STATUS_TYPE.OFFLINE) {
                    await syncData();
                    await fetchMediaItems();
                    setServerStatus(SERVER_STATUS_TYPE.ONLINE);
                }
            } catch (error) {
                console.error("Server is offline", error);
                if(serverStatus === SERVER_STATUS_TYPE.ONLINE) {
                    setServerStatus(SERVER_STATUS_TYPE.OFFLINE);
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [serverStatus]);

    useEffect(() => {
        const initializeSocket = () => {
            const ws = new WebSocket('ws://192.168.0.169:9090/ws?client_id=deepfake_guardian_client');
            
            ws.onopen = () => {
                console.log('ws open');
            };
            
            ws.onmessage = (e: MessageEvent) => {
                const message: WebSocketMessage = JSON.parse(e.data);
                if (message.type === WEBSOCKET_MESSAGE_TYPE.MEDIA_UPDATED) {
                    console.log('Media updated RECEVING');
                    fetchMediaItems();
                }
            };
            
            ws.onclose = () => {
                console.log('ws close');
            };
            
            setSocket(ws);
        };

        if (serverStatus === SERVER_STATUS_TYPE.ONLINE) {
            initializeSocket();
        }

        return () => {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        };
    }, [serverStatus]);

    const syncData = async () => {
        for (let i = 0; i < mediaItemsThatNeedToBeUpdated.length; i++) {
          await updateMedia({...mediaItemsThatNeedToBeUpdated[i], tags: mediaItemsThatNeedToBeUpdated[i].tags.join(",")});
        }
        for (let i = 0; i < mediaItemsThatNeedToBeDeleted.length; i++) {
          await removeMediaItem(mediaItemsThatNeedToBeDeleted[i]);
        }
        mediaItemsThatNeedToBeUpdated = [];
        mediaItemsThatNeedToBeDeleted = [];
      }

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
            if(serverStatus === SERVER_STATUS_TYPE.OFFLINE) {
                mediaItemsThatNeedToBeDeleted.push(id);
                allMediaItems.current = allMediaItems.current.filter((mediaItem) => mediaItem.id !== id);
                handleSearch(lastSearchTerm.current);
                return;
            }
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
            if(serverStatus === SERVER_STATUS_TYPE.OFFLINE) {
                // replace if already exists to avoid duplicates calls to server
                const existingIndex = mediaItemsThatNeedToBeUpdated.findIndex((item) => item.id === mediaItem.id);
                if (existingIndex !== -1) {
                    mediaItemsThatNeedToBeUpdated[existingIndex] = mediaItem;
                } else {
                    mediaItemsThatNeedToBeUpdated.push(mediaItem);
                }
                allMediaItems.current = allMediaItems.current.map((item) => {
                    if (item.id === mediaItem.id) {
                        return mediaItem;
                    }
                    return item;
                });
                handleSearch(lastSearchTerm.current);
                return;
            }
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
                serverStatus,
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
