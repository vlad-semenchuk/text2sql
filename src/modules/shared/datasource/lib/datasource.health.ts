import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

@Injectable()
export class DatasourceHealthIndicator {
  constructor(
    private readonly dataSource: DataSource,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource not initialized');
      }

      await this.dataSource.query('SELECT 1');

      return indicator.up({
        message: 'Database connection is healthy',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return indicator.down({
        message: errorMessage,
      });
    }
  }
}
