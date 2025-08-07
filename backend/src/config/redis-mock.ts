// Mock Redis for local development
export const mockRedis = {
  async get(key: string) {
    console.log(`[Mock Redis] GET ${key}`);
    return null;
  },
  async set(key: string, value: any, options?: any) {
    console.log(`[Mock Redis] SET ${key}:`, value);
    return 'OK';
  },
  async del(key: string) {
    console.log(`[Mock Redis] DEL ${key}`);
    return 1;
  }
};
