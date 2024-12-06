export type MediaItem = {
    id: string;
    title: string;
    description: string;
    location: string;
    type: MEDIA_TYPE;
    mimeType: string;
    size: number;
    tags: string[];
    mediaData: Uint8Array;
};

export const MEDIA_TYPE = {
    IMAGE: "IMAGE",
    VIDEO: "VIDEO",
} as const;
export type MEDIA_TYPE = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];
