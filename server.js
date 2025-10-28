import express from "express";
import { getBucketFiles } from "./bucketController.js";

const app = express();

app.get("/bucket/files", getBucketFiles);

app.listen(8080, () => console.log("Server running on port 8080"));
