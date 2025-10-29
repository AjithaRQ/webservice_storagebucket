// Load express module using `require` directive
 
// import multer from "multer";
import { createRedisClient } from "./config/redisClient.js";
import { S3Client, PutObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
// import fs from "fs";
import express from "express";
import cors from "cors";
import { pipeline } from "stream";
import { promisify } from "util";
 
//let app = express();
const app = express();
app.use(cors());
app.use(express.json());
// Define request response in root URL (/)
app.get("/", function (req, res) {
  res.send("Dockerize the node app");
});
 
// Define request response in root URL (/)
app.get("/health", function (req, res) {
  res.json({
    app2: true,
    success: true,
    status: "OK", redis: redis?.isOpen || false 
  });///
});
 
// Launch listening server on port 8081
app.listen(8080, function () {
  console.log("app listening on port 8080");
});

// ✅ Initialize Redis when server starts
let redis;
(async () => {
  redis = await createRedisClient();
  if (redis?.isOpen) console.log("🚀 Redis ready for caching!");
})();

// --- Redis Test Endpoint ---
app.get("/cache-test", async (req, res) => {
  try {
    await redis.set("message", "Hello from Redis + S3 App!", { EX: 60 });
    const message = await redis.get("message");
    res.json({ success: true, message });
  } catch (error) {
    console.error("Redis test failed:", error);
    res.status(500).json({ success: false, error: "Redis connection failed" });
  }
});
 
// Promisify pipeline for easier async/await
app.use("/upload", express.raw({ type: "*/*", limit: "50mb" }));
const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});
app.post("/upload", async (req, res) => {
  try {
    const fileBuffer = req.body;
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).send("No file received");
    }
 
    const bucketName = "revolte-ramco-code-red";
    const key = "apple.png";
 
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: req.headers["content-type"] || "application/octet-stream",
    });
 
    await s3.send(command);
 
    res.status(200).send({ message: "File uploaded successfully", key });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading file");
  }
});
 
 
const streamPipeline = promisify(pipeline);
 
app.get("/object", async (req, res) => {
  const bucketName = "revolte-ramco-code-red";
  const key = req.query.key; // pass ?key=apple.png
 
  if (!key) {
    return res.status(400).send("Missing key parameter");
  }
 
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
 
    const response = await s3.send(command);
 
    // Set headers so the browser downloads the file
    res.setHeader(
      "Content-Type",
      response.ContentType || "application/octet-stream"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${key}"`);
 
    // Pipe the S3 stream to the client response
    await streamPipeline(response.Body, res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error downloading object");
  }
});
