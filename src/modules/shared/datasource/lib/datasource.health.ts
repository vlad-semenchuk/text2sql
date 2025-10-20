import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

@Injectable()
export class DatasourceHealthIndicator extends HealthIndicator {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource not initialized');
      }

      await this.dataSource.query('SELECT 1');

      return this.getStatus(key, true, {
        message: 'Database connection is healthy',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          message: errorMessage,
        }),
      );
    }
  }
}
