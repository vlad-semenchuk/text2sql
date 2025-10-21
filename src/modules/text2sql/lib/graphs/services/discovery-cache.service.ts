import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface CachedDiscoveryContent {
  schemaHash: string;
  content: {
    description: string;
    exampleQuestions: string[];
  };
  cachedAt: string;
}

@Injectable()
export class DiscoveryCacheService {
  private readonly logger = new Logger(DiscoveryCacheService.name);
  private readonly cacheDir = join(process.cwd(), '.cache');
  private readonly cacheFile = join(this.cacheDir, 'discovery-content.json');

  async get(schemaHash: string): Promise<CachedDiscoveryContent | null> {
    try {
      const content = await fs.readFile(this.cacheFile, 'utf-8');
      const cached: CachedDiscoveryContent = JSON.parse(content);

      if (cached.schemaHash === schemaHash) {
        this.logger.log('Cache hit: Discovery content loaded from cache');
        return cached;
      }

      this.logger.log('Cache miss: Schema hash mismatch');
      return null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.log('Cache miss: No cache file found');
      } else {
        this.logger.warn(`Error reading cache: ${(error as Error).message}`);
      }
      return null;
    }
  }

  async set(schemaHash: string, content: { description: string; exampleQuestions: string[] }): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });

      const cached: CachedDiscoveryContent = {
        schemaHash,
        content,
        cachedAt: new Date().toISOString(),
      };

      await fs.writeFile(this.cacheFile, JSON.stringify(cached, null, 2), 'utf-8');
      this.logger.log('Discovery content cached successfully');
    } catch (error) {
      this.logger.error(`Error writing cache: ${(error as Error).message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.cacheFile);
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error(`Error clearing cache: ${(error as Error).message}`);
      }
    }
  }

  calculateSchemaHash(schema: string): string {
    return createHash('sha256').update(schema).digest('hex');
  }
}
