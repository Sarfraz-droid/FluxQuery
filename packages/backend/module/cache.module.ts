import NodeCache from "node-cache";

export class NodeCacheModule {
    cache: NodeCache;
    constructor() {
        this.cache = new NodeCache();
    }
    public set(key: string, value: string, ttl: number = 24*60*60) { 
        this.cache.set(key, value, ttl);
    }
    public get(key: string) {
        return this.cache.get(key);
    }
    public delete(key: string) {
        return this.cache.del(key);
    }

}

export const CacheModule = new NodeCacheModule();