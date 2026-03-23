# Nest Border Patrol

A package for validating NestJS HTTP controller endpoints using zod. Integrates
with NestJS swagger.

## Getting started

Install the package:

```bash
npm i @qte/nest-border-patrol
```

```bash
yarn add @qte/nest-border-patrol
```

```bash
pnpm add @qte/nest-border-patrol
```

You also will need the following dependencies if you haven't installed them
already

- @nestjs/common
- @nestjs/swagger
- rxjs
- zod

## Usage

Create a `new HttpBorder(options)` instance. Options are the following

- `requestBody` (optional) - Any Zod schema
- `parameters` (optional)
  - `path` (optional) - A string record of Zod schemas where the key is the name
    of your URL parameters
  - `query` (optional) - A string record of Zod schemas
- `responses` - A record with keys of `HttpStatus` and values of any zod schema

To make use of the newly created `HttpBorder` you decorate your controller
endpoint with the `@UseHttpBorder()` decorator. This will in turn validate the
incoming request and outgoing responses with the supplied schemas in the
`HttpBorder` constructor.

The `@UseHttpBorder()` decorator will also decorate your controller method with
matching `@nestjs/swagger` decorators for generating OpenAPI schemas.

### Example

```ts
import { Body, Controller, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  HttpBorder,
  InferFromHttpBorder
} from '@qte/nest-border-patrol';

// Create a border
const border = new HttpBorder({
  requestBody: z.object({
    name: z.string(),
  }),
  parameters: {
    path:  {
      someParam: z.string(),
    },
    query: {
      someQueryParam: z.string().optional(),
    },
  }
  responses: {
    [HttpStatus.CREATED]: z.object({
      publicData: z.string(),
    }),
  }
});

@Controller()
export class SampleController {
  @Post('/:someParam')
  @UseBorder(border)
  public async post(
    // Will be typed as:
    //  { name: string }
    @Body() body: InferFromHttpBorder<typeof border, 'requestBody'>,
    // Will be typed as:
    // { someQueryParam: string | undefined; }
    @Query() query: InferFromHttpBorder<typeof border, 'queryParameters'>,
    // Will be typed as:
    // { someParam: string; }
    @Param() params: InferFromHttpBorder<typeof border, 'pathParameters'>
  ): // Will be typed as:
  // HttpBorderResponse<HttpStatus.CREATED, { publicData: string; }>
  Promise<InferFromHttpBorder<typeof border, 'response'>> {
    return border.createResponse(HttpStatus.CREATED, {
      publicData: 'Hello world',
      // This property will stripped from the response as
      // it is not defined in the response schema.
      sensitiveData: 'password',
    });
  }
}
```

## Versioning

Until the package reaches 1.0.0 all updates may be breaking.

## Potential roadmap

- Validating headers incoming and outgoing
- OpenAPI example values
- Test typings using `// @ts-expect-error`
- Validate query params as an object (OpenAPI issues)
- Validate unnamed query params
