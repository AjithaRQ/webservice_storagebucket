// config/redisClient.js
import { createClient } from "redis";

let redisClient;

export const createRedisClient = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisHost = process.env.CACHE_HOST || "127.0.0.1";
  const redisPort = Number(process.env.CACHE_PORT) || 6379;
  const redisPassword = process.env.CACHE_PASSWORD || undefined;

  redisClient = createClient({
    socket: {
      host: redisHost,
      port: redisPort,
    },
    password: redisPassword,
  });

  redisClient.on("connect", () => console.log(`✅ Redis connected to ${redisHost}:${redisPort}`));
  redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

  try {
    await redisClient.connect();
  } catch (err) {
    console.error("🚨 Failed to connect to Redis:", err);
  }

  return redisClient;
};
