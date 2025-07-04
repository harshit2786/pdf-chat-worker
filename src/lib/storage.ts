import { Storage } from "@google-cloud/storage";
import path from "path"

const storage = new Storage({
  keyFilename: path.join(__dirname, "../../cloud-key.json"),
});
export const bucketClient = storage.bucket(process.env.BUCKET_NAME ?? "");