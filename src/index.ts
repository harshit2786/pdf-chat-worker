import { Worker } from "bullmq";
import { prismaClient } from "./lib/db";
import { bucketClient } from "./lib/storage";
import { createCollection, QDRANT_COLLECTION, qdrantClient } from "./lib/qdrant";
import { connection } from "./lib/queue";
import PdfParse from "pdf-parse";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantVectorStore } from "@langchain/qdrant";
import fs from "fs";
import path from "path";
import os from "os";
import "dotenv/config";

const TEMP_DIR = path.join(os.tmpdir(), "pdf-worker-temp");
fs.mkdirSync(TEMP_DIR, { recursive: true });

createCollection();

const worker = new Worker(
  "embeddingQueue",
  async (job) => {
    const { pdfId, userId, blobName } = job.data;

    console.log(`🧩 Starting PDF embedding: ${pdfId}`);

    const localPath = path.join(TEMP_DIR, `${pdfId}.pdf`);

    try {
      const pdf = await prismaClient.pdfs.findFirst({
        where: { id: pdfId, userId },
      });

      if (!pdf) throw new Error("PDF not found in DB");

      // Download private PDF from GCS
      const file = bucketClient.file(blobName);
      await file.download({ destination: localPath });

      // Count pages using pdf-parse
      const fileBuffer = fs.readFileSync(localPath);
      const parsed = await PdfParse(fileBuffer);
      const totalPages = parsed.numpages;

      // Load + chunk + embed PDF
      const loader = new PDFLoader(localPath);
      const docs = await loader.load();
      const pageNum = docs?.[0]?.metadata?.pdf?.totalPages;

      const enrichedDocs = docs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          pdfId: String(pdfId),
          userId: String(userId),
          folderId: String(pdf.folderId),
          pdfUrl: pdf.url,
        },
      }));

      await QdrantVectorStore.fromDocuments(
        enrichedDocs,
        new OpenAIEmbeddings({ model: "text-embedding-3-small" }),
        {
          client: qdrantClient,
          collectionName: QDRANT_COLLECTION,
        }
      );

      // Update DB: Mark PDF as processed
      await prismaClient.pdfs.update({
        where: { id: pdfId },
        data: {
          status: "PROCESSED",
          totalPages : pageNum,
        },
      });

      console.log(`✅ Embedded PDF ${pdfId} successfully`);
    } catch (err: any) {
      console.error(`❌ Failed to embed PDF ${pdfId}:`, err.message);

      try {
        // Rollback: delete PDF from bucket
        const file = bucketClient.file(blobName);
        await file.delete();

        // Delete from DB
        await prismaClient.pdfs.delete({ where: { id: pdfId } });

        console.log(`🗑️ Cleaned up failed PDF ${pdfId}`);
      } catch (cleanupErr) {
        console.error("⚠️ Cleanup failed:", cleanupErr);
      }
    } finally {
      // Delete temp file
      try {
        fs.unlinkSync(localPath);
      } catch (_) {}
    }
  },
  { connection }
);
