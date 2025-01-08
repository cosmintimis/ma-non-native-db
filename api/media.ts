import { MediaItem } from "@/model/mediaItem";
import axios from "axios";

const BASE_URL = 'http://192.168.0.169:9090/api/media/v1';

export type MediaItemAPI = {
    id: string;
    title: string;
    description: string;
    location: string;
    type: string;
    mimeType: string;
    size: number;
    tags: string;
    mediaData: string;
}

export const getMediaItems = async (): Promise<MediaItem[]> => {
    const response = await axios.get(`${BASE_URL}/all`);
    const mediaItems: MediaItem[] = response.data.map((item: MediaItemAPI) => {
        return {
            id: item.id,
            title: item.title,
            description: item.description,
            location: item.location,
            type: item.type,
            mimeType: item.mimeType,
            size: item.size,
            tags: item.tags.split(","),
            mediaData: item.mediaData
        }
    });
    return mediaItems;
}

export const createMediaItem = async (mediaItem: Omit<MediaItemAPI, 'id'>): Promise<MediaItemAPI> => {
    const response = await axios.post(`${BASE_URL}`, mediaItem);
    return {
        ...response.data,
        tags: response.data.tags.split(",")
    }
}

export const removeMediaItem = async (id: string): Promise<{deleted: boolean}> => {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
}

export const getMediaItemById = async (id: string): Promise<MediaItem> => {
    const response = await axios.get(`${BASE_URL}?id=${id}`);
    const item: MediaItemAPI = response.data;
    return {
        id: item.id,
        title: item.title,
        description: item.description,
        location: item.location,
        type: item.type as any,
        mimeType: item.mimeType,
        size: item.size,
        tags: item.tags.split(","),
        mediaData: item.mediaData
    }
}

export const updateMedia = async (mediaItem: MediaItemAPI): Promise<MediaItem> => {
    const response = await axios.put(`${BASE_URL}/${mediaItem.id}`, mediaItem);
    return {
        ...response.data,
        tags: response.data.tags.split(",")
    }
}