import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

export function createConvexClient(convexUrl: string): ConvexHttpClient {
  return new ConvexHttpClient(convexUrl);
}

export { api };

