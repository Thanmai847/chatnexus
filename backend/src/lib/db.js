import mongoose from "mongoose";
import dns from "dns";
import { ENV } from "./env.js";

// Prefer public DNS servers for SRV lookups if local resolver refuses
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const buildFallbackFromSrv = async (srvUri) => {
  // srvUri expected like: mongodb+srv://user:pass@cluster0.xyz.mongodb.net/<path>
  try {
    const withoutPrefix = srvUri.replace(/^mongodb\+srv:\/\//i, "");
    const atIndex = withoutPrefix.indexOf("@");
    let auth = "";
    let rest = withoutPrefix;
    if (atIndex !== -1) {
      auth = withoutPrefix.slice(0, atIndex);
      rest = withoutPrefix.slice(atIndex + 1);
    }

    const firstSlash = rest.indexOf("/");
    const host = firstSlash === -1 ? rest : rest.slice(0, firstSlash);
    const path = firstSlash === -1 ? "" : rest.slice(firstSlash); // includes leading '/'

    const srvName = `_mongodb._tcp.${host}`;
    const records = await dns.promises.resolveSrv(srvName);
    const hosts = records.map(r => `${r.name}:${r.port || 27017}`);

    const authPrefix = auth ? `${auth}@` : "";
    const fallback = `mongodb://${authPrefix}${hosts.join(",")}${path}`;
    return fallback;
  } catch (err) {
    throw err;
  }
};

export const connectDB = async () => {
  const uri =   ENV.MONGO_URI;
  try {
    const conn = await mongoose.connect(uri);
    console.log("MONGODB CONNECTED:", conn.connection.host);
    return conn;
  } catch (error) {
    console.error("Initial MONGODB connection failed:", error && error.stack ? error.stack : error);

    // If the error is DNS SRV related and the URI used mongodb+srv, try a fallback
    if (uri && uri.toLowerCase().startsWith("mongodb+srv://")) {
      try {
        console.log("Attempting SRV fallback: resolving SRV records and retrying with mongodb://...");
        const fallbackUri = await buildFallbackFromSrv(uri);
        const conn = await mongoose.connect(fallbackUri);
        console.log("MONGODB CONNECTED (fallback):", conn.connection.host);
        return conn;
      } catch (fallbackErr) {
        console.error("Fallback connection also failed:", fallbackErr && fallbackErr.stack ? fallbackErr.stack : fallbackErr);
      }
    }

    process.exit(1);
  }
};
