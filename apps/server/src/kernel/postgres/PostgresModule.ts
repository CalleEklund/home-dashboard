import { DynamicModule, FactoryProvider, Global, Module } from '@nestjs/common';
import {
  POSTGRES_MODULE_OPTIONS_KEY,
  PostgresModuleAsyncOptions,
  PostgresModuleOptions,
} from './PostgresModuleOptions';
import { PostgresPoolProvider } from './PostgresPool';
import { PostgresPoolEnder } from './PostgresPoolEnder';

@Global()
@Module({})
export class PostgresModule {
  public static forRootAsync(
    options: PostgresModuleAsyncOptions,
  ): DynamicModule {
    const optionsProvider: FactoryProvider<PostgresModuleOptions> = {
      inject: options.inject ?? [],
      provide: POSTGRES_MODULE_OPTIONS_KEY,
      useFactory: options.useFactory,
    };
    return {
      module: PostgresModule,
      imports: options.imports ?? [],
      providers: [optionsProvider, PostgresPoolEnder, PostgresPoolProvider()],
      exports: [PostgresPoolProvider()],
      global: true,
    };
  }
}
