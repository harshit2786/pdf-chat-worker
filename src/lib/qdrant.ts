import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
export const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? "pdf_embeddings"

export const qdrantClient = new QdrantClient({ url: QDRANT_URL });

export async function createCollection() {
  const collectionName = QDRANT_COLLECTION;

  const exists = await qdrantClient.getCollections().then(res =>
    res.collections.some(col => col.name === collectionName)
  );

  if (exists) {
    console.log(`Collection "${collectionName}" already exists.`);
    return;
  }

  await qdrantClient.createCollection(collectionName, {
    vectors: {
      size: 1536,
      distance: "Cosine",
    },
  });

  console.log(`✅ Collection "${collectionName}" created.`);
}