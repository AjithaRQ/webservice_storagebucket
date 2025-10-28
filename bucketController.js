import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import redisClient from "./cache.js";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = "your-bucket-name";

export const getBucketFiles = async (req, res) => {
  const cacheKey = "bucket:fileList";

  try {
    // 1️⃣ Check cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("📦 Returning cached S3 data");
      return res.json(JSON.parse(cachedData));
    }

    // 2️⃣ Fetch from S3
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
    const response = await s3.send(command);
    const files = response.Contents || [];

    // 3️⃣ Cache in Redis for 10 mins
    await redisClient.set(cacheKey, JSON.stringify(files), { EX: 600 });

    console.log("🆕 Cached S3 data");
    return res.json(files);
  } catch (err) {
    console.error("Error fetching bucket data:", err);
    res.status(500).send("Error fetching bucket data");
  }
};
