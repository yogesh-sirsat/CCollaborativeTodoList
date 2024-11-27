import { MongoClient, Db } from "mongodb";
import "dotenv/config";
import logger from "./logger";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME;

let cachedClient: MongoClient | null = null;

export async function connectToMongoDB(): Promise<{
  db: Db;
  client: MongoClient;
}> {
  if (cachedClient) {
    return { db: cachedClient.db(dbName), client: cachedClient };
  }

  if (!uri) {
    throw new Error("Please add Mongo URI to .env");
  }

  if (!dbName) {
    throw new Error("Please add Mongo database name to .env");
  }

  const client = new MongoClient(uri, {});

  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    logger.info("Pinged deployment. Successfully connected to MongoDB!");
    cachedClient = client;
    return { db: client.db(dbName), client };
  } catch (e: any) {
    await client.close();
    throw new Error(e.message);
  }
}
