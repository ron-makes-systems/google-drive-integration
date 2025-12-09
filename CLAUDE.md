# Fibery Connector Development Guide

This project is a Fibery connector for synchronizing data from external services (e.g., Linear) to Fibery.

## Project Structure

```
src/
├── index.ts              # Entry point - runs the server
├── app.ts                # Express app setup with middleware and routes
├── server.ts             # Server initialization and shutdown handling
├── config.ts             # Configuration object built from env
├── env.ts                # Environment variable validation using envalid
├── connectorConfig.ts    # Connector metadata (id, name, authentication fields)
├── api/                  # External API client(s). Communication with external platform is defined here 
├── synchronizer/
│   ├── configProvider.ts     # Returns synchronizer config (types, filters)
│   ├── schemaProvider.ts     # Returns schema for each entity type
│   ├── dataProvider.ts       # Routes data requests to specific providers
│   ├── resourceProvider.ts   # Handles file/resource streaming
│   └── dataProviders/        # One file per entity type
│       └── {object}.ts       # Transform and fetch logic for each type
├── routes/
│   ├── synchronizerRoutes.ts # /api/v1/synchronizer/* endpoints
│   └── validation.ts         # /validate endpoint
├── types/                    # and types (d.ts) defined on connector level
├── errors/
│   ├── errors.ts             # AppError, ValidationError classes
│   └── errorMiddleware.ts    # Express error handler
├── infra/
│   ├── logger.ts             # Logger setup with correlation ID
│   └── correlationId.ts      # Request correlation ID middleware
├── utils/
└── public/
    └── logo.svg              # Connector logo
```

## Code Style

### TypeScript Configuration
- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- ESM modules with `.js` extensions in imports

### Formatting (Prettier)
- Tab width: 2 spaces
- Double quotes
- Trailing commas
- No bracket spacing
- Print width: 120

### Linting (ESLint)
- No explicit `any` (use `unknown` instead)
- No unused variables
- TypeScript strict rules

## Commands

```bash
pnpm install       # Install dependencies
pnpm build         # Compile TypeScript
pnpm start         # Build and start server
pnpm lint          # Run ESLint
pnpm test          # Run tests
```

## Error Handling

Use `AppError` for API errors with status codes:
```typescript
throw new AppError({
  statusCode: 400,
  message: "Invalid request",
  tryLater: false,  // Set true for rate limits (429)
});
```

## Best Practices

1. **Use async/await** with `asyncWrap` for route handlers
2. **Transform data** in data providers, not in API layer
3. **Include correlation IDs** for request tracing
4. **Handle pagination** with `hasNext` and `nextPageConfig`
5. **Support delta sync** using `lastSynchronizedAt` parameter if possible
6. **Rate limit API calls** using `p-limit`
7. **your-connector**: When setting integration up, look for "your-connector" or "Your Connector" to find all places where template expects developer to start writing integration-specific code 
8. **Port**: Use different port from what in the example. Generally, ports from 3510 to 3520 are available
9. **Iterative Development**. This is THE MOST IMPORTANT. Split your work in reasonable, verifiable/testable chunks and check that implementation is correct (at least by building it) to not pile up errors. 