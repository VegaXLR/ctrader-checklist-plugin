# @veksa/logger

[![npm version](https://img.shields.io/npm/v/@veksa/logger.svg?style=flat-square)](https://www.npmjs.com/package/@veksa/logger)
[![npm downloads](https://img.shields.io/npm/dm/@veksa/logger.svg?style=flat-square)](https://www.npmjs.com/package/@veksa/logger)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE.md)

Lightweight, configurable logging library for JavaScript applications

## Installation

@veksa/logger requires **TypeScript 5.8 or later**.

### Using npm or yarn

```bash
# npm
npm install @veksa/logger

# yarn
yarn add @veksa/logger
```

## Features

- Enhanced console logging with timestamps
- Memory storage of logs with automatic expiration (10 minutes by default)
- Special formatting for requests, responses, and events
- Easy enabling/disabling of logging
- Support for restricting specific message IDs
- Colorized console output
- Generic type support for type-safe message handling
- Utility functions for log management
- Automatic sanitization of binary data (Buffer, Uint8Array) to prevent performance issues with large payloads

## Basic Usage

```typescript
import { createLogger } from '@veksa/logger';

// Create logger (enabled by default)
const logger = createLogger(true);

// Basic logging
logger.info('Application started');
logger.warn('Resource is running low');
logger.error('Failed to connect', { code: 500 });

// Network message logging
logger.request({
  id: 'GET_USER',
  payload: { userId: 123 },
  clientMsgId: 'abc-123'
}, {
  prefix: 'API',
  messageName: 'GetUser'
});

logger.response({
  id: 'GET_USER',
  payload: { user: { id: 123, name: 'John' } },
  clientMsgId: 'abc-123'
}, {
  prefix: 'API',
  messageName: 'GetUser'
});

// Get all stored logs
const logs = logger.getLogs();

// Disable logging
logger.disable();

// Enable logging
logger.enable();
```

## API Reference

### `createLogger<Message>(isEnabled, isRestricted?)`

Creates a new logger instance.

- `isEnabled` (boolean): Whether logging is initially enabled
- `isRestricted` (function): Optional function that determines if a message ID should be restricted from logging

Returns an `ILogger<Message>` object with the following methods:

### Methods

- `enable()`: Enable console output
- `disable()`: Disable console output
- `getLogs()`: Get array of stored log items
- `info(text, ...causes)`: Log informational message
- `error(text, ...causes)`: Log error message
- `warn(text, ...causes)`: Log warning message
- `request(item, meta?)`: Log request with optional metadata
- `response(item, meta?)`: Log response with optional metadata
- `event(item, meta?)`: Log event with optional metadata

### Interfaces

```typescript
interface ILogItem {
    timestamp: number;
    message: string;
}

interface IMessage<Payload = unknown> {
    id?: string | number;
    payload: Payload;
    clientMsgId: string;
}

interface IMessageMeta {
    prefix?: string;
    prefixColor?: string;
    messageName?: string;
}

interface ILogger<Message extends IMessage> {
    enable: () => void;
    disable: () => void;
    getLogs: () => ILogItem[];
    info: (text: string, ...causes: unknown[]) => void;
    error: (text: string, ...causes: unknown[]) => void;
    warn: (text: string, ...causes: unknown[]) => void;
    request: (item: Message, meta?: IMessageMeta) => void;
    response: (item: Message, meta?: IMessageMeta) => void;
    event: (item: Message, meta?: IMessageMeta) => void;
}
```

### Helper Functions

#### `mergeLogs(limit)`

Merges multiple log arrays into a single array, sorted by timestamp.

- `limit` (number): Maximum number of log messages to return

```typescript
import { createLogger, mergeLogs } from '@veksa/logger';

const logger1 = createLogger(true);
const logger2 = createLogger(true);

// Get combined logs from both loggers, limited to 100 entries
const combinedLogs = mergeLogs(100)(logger1.getLogs(), logger2.getLogs());
```

#### `sanitizeObject(obj)`

Recursively sanitizes an object by replacing binary data (Buffer, Uint8Array) with string representations to prevent performance issues when logging large payloads.

- `obj` (unknown): The object to sanitize

```typescript
import { sanitizeObject } from '@veksa/logger';

const data = {
  image: Buffer.from('large binary data'),
  metadata: { size: 1024 }
};

const sanitized = sanitizeObject(data);
// Result: { image: '<Buffer: 17 bytes>', metadata: { size: 1024 } }
```

This function is automatically used internally by the logger when serializing objects for log messages, ensuring that large binary data doesn't cause performance issues or memory bloat.

## Contributing

This project welcomes contributions and suggestions.

## License

[MIT](LICENSE.md)
