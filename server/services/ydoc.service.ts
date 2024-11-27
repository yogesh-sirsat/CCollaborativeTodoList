import {connectToMongoDB} from "../utils/mongodb";
import {YDocUpdate} from "../models/ydoc.model";
import logger from "../utils/logger";
import * as Y from "yjs";

/**
 * Get the latest version number of the YDoc update from the database.
 * @param docId - The id of the YDoc.
 * @returns
 */
export async function getLatestYDocUpdateVersion(docId: string): Promise<number> {
  try {
    const {db} = await connectToMongoDB();
    const collection = db.collection<YDocUpdate>("yDocUpdates");
    const [result] = await collection.find({docId}).sort({version: -1}).limit(1).toArray();
    if (result && result.version) {
      return result.version;
    }
    return 0;
  } catch (e: any) {
    logger.error("Error getting latest YDoc update version", {stack: e.stack});
    return 0;
  }
}

/**
 * This function fetches all the updates from the database and applies them to the YDoc.
 * It returns the YDoc update as a Uint8Array.
 * @param docId - The id of the YDoc.
 * @returns
 */
export async function getFullYDocUpdateBuild(docId: string): Promise<Uint8Array> {
  try {
    const {db} = await connectToMongoDB();
    const collection = db.collection<YDocUpdate>("yDocUpdates");
    const docUpdates = await collection.find({docId}).toArray();
    const yDoc = new Y.Doc();

    const mergedUpdates = Y.mergeUpdates(docUpdates.map((update) => {
      return new Uint8Array(Buffer.from(update.update, "base64"));
    }));
    logger.info(`Got full update from DB for docId ${docId}`);
    return mergedUpdates;
  } catch (e: any) {
    logger.error("Error getting full YDoc update from DB", {stack: e.stack});
    const yDoc = new Y.Doc();
    return Y.encodeStateAsUpdate(yDoc);
  }
}

/**
 * This function saves the YDoc update to the database.
 * @param docId - The id of the YDoc.
 * @param update - The YDoc update as a Uint8Array.
 */
export async function saveYDocUpdateToDB(docId: string, update: Uint8Array) {
  try {
    const {db} = await connectToMongoDB();
    const collection = db.collection<YDocUpdate>("yDocUpdates");
    const currentVersion = await getLatestYDocUpdateVersion(docId);
    const base64Update = Buffer.from(update).toString("base64");  // May need to use some different method but right I'm getting some error
    await collection.insertOne({
      docId,
      version: currentVersion + 1,
      update: base64Update,
      timestamp: Date.now(),
    });
    logger.info(`Saved update to DB for docId ${docId}`);
  } catch (e: any) {
    logger.error("Error saving YDoc update to DB", {stack: e.stack});
  }
}
