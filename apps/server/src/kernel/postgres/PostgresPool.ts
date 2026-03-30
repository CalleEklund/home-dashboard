import { FactoryProvider, Inject } from '@nestjs/common';
import {
  createPool,
  createTypeParserPreset,
  DatabasePool,
  type Interceptor,
  type QueryResultRow,
  SchemaValidationError,
} from 'slonik';
import {
  POSTGRES_MODULE_OPTIONS_KEY,
  PostgresModuleOptions,
} from './PostgresModuleOptions';

const createResultParserInterceptor = (): Interceptor => {
  return {
    transformRow: async (executionContext, actualQuery, row) => {
      const { resultParser } = executionContext;

      if (!resultParser) {
        return row;
      }

      const validationResult = await resultParser.safeParseAsync(row);

      if (!validationResult.success) {
        throw new SchemaValidationError(
          actualQuery,
          row,
          validationResult.error.issues,
        );
      }

      return validationResult.data as QueryResultRow;
    },
  };
};

export type PostgresPool = DatabasePool;

export const POSTGRES_POOL_KEY = Symbol('POSTGRES_POOL');

export const createPostgresPool = async (options: PostgresModuleOptions) => {
  return await createPool(options.connectionUri, {
    maximumPoolSize: 30,
    interceptors: [createResultParserInterceptor()],
    typeParsers: [...createTypeParserPreset()],
    dangerouslyAllowForeignConnections: true,
  });
};

export const PostgresPoolProvider = (): FactoryProvider<PostgresPool> => ({
  provide: POSTGRES_POOL_KEY,
  inject: [POSTGRES_MODULE_OPTIONS_KEY],
  useFactory: createPostgresPool,
});

export const InjectPostgresPool = () => Inject(POSTGRES_POOL_KEY);
