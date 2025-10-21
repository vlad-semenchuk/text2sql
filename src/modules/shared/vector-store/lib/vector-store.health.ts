import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { VectorStoreService } from './vector-store.service';

@Injectable()
export class VectorStoreHealthIndicator {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.vectorStoreService.ping();

      return indicator.up({
        message: 'VectorStore connection is healthy',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return indicator.down({
        message: errorMessage,
      });
    }
  }
}
