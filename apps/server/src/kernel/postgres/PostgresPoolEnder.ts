import { OnApplicationShutdown } from '@nestjs/common';
import { InjectPostgresPool, PostgresPool } from './PostgresPool';

export class PostgresPoolEnder implements OnApplicationShutdown {
  public constructor(
    @InjectPostgresPool() private readonly pool: PostgresPool,
  ) {}
  public async onApplicationShutdown() {
    await this.pool.end();
  }
}
