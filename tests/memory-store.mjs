export class MemoryStore {
  records = new Map();
  revision = 0;
  async get(key) { return structuredClone(this.records.get(key)?.data ?? null); }
  async getWithMetadata(key) { return structuredClone(this.records.get(key) ?? null); }
  async setJSON(key, data, condition = {}) {
    const current = this.records.get(key);
    if (condition.onlyIfNew && current || condition.onlyIfMatch && condition.onlyIfMatch !== current?.etag)
      return {modified: false};
    const etag = String(++this.revision);
    this.records.set(key, {data: structuredClone(data), etag});
    return {modified: true, etag};
  }
  async delete(key) { this.records.delete(key); }
  async list({prefix}) { return {blobs: [...this.records.keys()].filter(key => key.startsWith(prefix)).map(key => ({key}))}; }
}
