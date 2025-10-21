import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DatasourceHealthIndicator } from '@modules/datasource';
import { VectorStoreHealthIndicator } from '@modules/vector-store';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly datasourceHealth: DatasourceHealthIndicator,
    private readonly vectorStoreHealth: VectorStoreHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.datasourceHealth.isHealthy('database'),
      () => this.vectorStoreHealth.isHealthy('vectorstore'),
    ]);
  }
}
