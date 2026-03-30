import {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
} from '@nestjs/common';

export interface PostgresModuleOptions {
  connectionUri: string;
}

export const POSTGRES_MODULE_OPTIONS_KEY = Symbol('POSTGRES_MODULE_OPTIONS');

export interface PostgresModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory: (
    ...args: any[]
  ) => Promise<PostgresModuleOptions> | PostgresModuleOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}
