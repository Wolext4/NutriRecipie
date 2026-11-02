const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command: string[]) {
  if (!redisUrl || !redisToken) return null;
  const response = await fetch(`${redisUrl}/${command.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${redisToken}` }
  });
  if (!response.ok) throw new Error(`Redis request failed (${response.status}).`);
  return (await response.json() as { result?: string | number | string[] | null }).result ?? null;
}

export async function cacheGet<T>(key: string) {
  try {
    const value = await redis(["get", key]);
    return typeof value === "string" ? JSON.parse(value) as T : null;
  } catch (error) {
    console.warn("Redis cache read failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, seconds: number) {
  try {
    await redis(["set", key, JSON.stringify(value), "EX", String(seconds)]);
  } catch (error) {
    console.warn("Redis cache write failed:", error instanceof Error ? error.message : error);
  }
}

export async function cacheDeleteByPrefix(prefix: string) {
  try {
    const keys = await redis(["keys", `${prefix}*`]);
    if (Array.isArray(keys) && keys.length) await redis(["del", ...keys as string[]]);
  } catch (error) {
    console.warn("Redis cache invalidation failed:", error instanceof Error ? error.message : error);
  }
}
