import { MEDIA_TYPE, MediaItem } from "@/model/mediaItem";
import * as SQLite from "expo-sqlite";
import { loadStoredImage } from "./generalUtils";
import uuid from "react-native-uuid";

const initDb = async (db: SQLite.SQLiteDatabase) => {
    try {
        await db.execAsync('PRAGMA journal_mode = WAL');
        await createMediaTableIfNotExists(db);
    } catch (error) {
        console.error("Error initializing database", error);
    }
};

const createMediaTableIfNotExists = async (db: SQLite.SQLiteDatabase) => {
    // check if table exists
    const tableExists = await checkIfTableExists(db, "media");
    if (tableExists) {
        return;
    }

    // create table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY NOT NULL,         
            title TEXT NOT NULL,                
            description TEXT,                   
            location TEXT,                     
            type TEXT NOT NULL,                 
            mimeType TEXT NOT NULL,               
            size INTEGER NOT NULL,               
            tags TEXT,                          
            mediaData BLOB NOT NULL         
        );
    `);

    // insert initial data
    const mediaItems = await loadInitMediaItems();
    const insertStatement = await db.prepareAsync(`
        INSERT INTO media (id, title, description, location, type, mimeType, size, tags, mediaData) 
        VALUES ($id, $title, $description, $location, $type, $mimeType, $size, $tags, $mediaData)
    `);
    try {
        for (const mediaItem of mediaItems) {
            await insertStatement.executeAsync({
                $id: mediaItem.id,
                $title: mediaItem.title,
                $description: mediaItem.description,
                $location: mediaItem.location,
                $type: mediaItem.type,
                $mimeType: mediaItem.mimeType,
                $size: mediaItem.size,
                $tags: mediaItem.tags.join(","),
                $mediaData: mediaItem.mediaData,
            });
        }
    } finally {
        await insertStatement.finalizeAsync();
    }
};

const checkIfTableExists = async (
    db: SQLite.SQLiteDatabase,
    tableName: string
): Promise<boolean> => {
    const statement = await db.prepareAsync(
        `SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=$tableName`
    );
    try {
        const result = await statement.executeAsync<{ count: number }>({
            $tableName: tableName,
        });
        const data = await result.getFirstAsync();
        return data ? data.count > 0 : false;
    } finally {
        await statement.finalizeAsync();
    }
};

type MediaItemDb = {
    id: string;
    title: string;
    description: string;
    location: string;
    type: string;
    mimeType: string;
    size: number;
    tags: string;
    mediaData: Uint8Array;
};

export const fetchMediaItems = async (
    db: SQLite.SQLiteDatabase
): Promise<MediaItem[]> => {
    const allRows = await db.getAllAsync<MediaItemDb>("SELECT * FROM media");
    const mediaItems: MediaItem[] = [];
    for (const row of allRows) {
        const mediaItem: MediaItem = {
            id: row.id,
            title: row.title,
            description: row.description,
            location: row.location,
            type: row.type as any,
            mimeType: row.mimeType,
            size: row.size,
            tags: row.tags.split(","),
            mediaData: row.mediaData,
        };
        mediaItems.push(mediaItem);
    }
    return mediaItems;
};

export const insertMediaItemDb = async (
    db: SQLite.SQLiteDatabase,
    mediaItem: MediaItem
): Promise<number> => {
    const insertStatement = await db.prepareAsync(`
        INSERT INTO media (id, title, description, location, type, mimeType, size, tags, mediaData) 
        VALUES ($id, $title, $description, $location, $type, $mimeType, $size, $tags, $mediaData)
    `);
    try {
        const result = await insertStatement.executeAsync({
            $id: mediaItem.id,
            $title: mediaItem.title,
            $description: mediaItem.description,
            $location: mediaItem.location,
            $type: mediaItem.type,
            $mimeType: mediaItem.mimeType,
            $size: mediaItem.size,
            $tags: mediaItem.tags.join(","),
            $mediaData: mediaItem.mediaData,
        });
        return result.changes;
    } finally {
        await insertStatement.finalizeAsync();
    }
};

export const updateMediaItemDb = async (
    db: SQLite.SQLiteDatabase,
    updatedMediaItem: MediaItem
): Promise<number> => {
    const updateStatement = await db.prepareAsync(`
        UPDATE media 
        SET title=$title, description=$description, location=$location, type=$type, mimeType=$mimeType, size=$size, tags=$tags, mediaData=$mediaData
        WHERE id=$id
    `);
    try {
        const result = await updateStatement.executeAsync({
            $id: updatedMediaItem.id,
            $title: updatedMediaItem.title,
            $description: updatedMediaItem.description,
            $location: updatedMediaItem.location,
            $type: updatedMediaItem.type,
            $mimeType: updatedMediaItem.mimeType,
            $size: updatedMediaItem.size,
            $tags: updatedMediaItem.tags.join(","),
            $mediaData: updatedMediaItem.mediaData,
        });
        return result.changes;  
    } finally {
        await updateStatement.finalizeAsync();
    }
}

export const deleteMediaItemDb = async (
    db: SQLite.SQLiteDatabase,
    id: string
): Promise<number> => {
    const deleteStatement = await db.prepareAsync(`
        DELETE FROM media WHERE id=$id
    `);
    try {
        const result = await deleteStatement.executeAsync({ $id: id });
        return result.changes;
    } finally {
        await deleteStatement.finalizeAsync();
    }
};

export default initDb;

async function loadInitMediaItems(): Promise<MediaItem[]> {
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
