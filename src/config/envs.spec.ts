import * as dotenv from 'dotenv';
import * as joi from 'joi';

// Mock dotenv to avoid loading actual .env files during tests
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('envs config', () => {
  const ORIGINAL_ENV = process.env;
  let envsModule: typeof import('./envs');

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should load and validate environment variables correctly', () => {
    process.env.PORT = '3000';
    process.env.NATS_SERVERS = 'nats://localhost:4222,nats://localhost:4223';
    process.env.JWT_SECRET = 'supersecret';

    envsModule = require('./envs');
    expect(envsModule.envs).toEqual({
      port: 3000,
      natsServers: ['nats://localhost:4222', 'nats://localhost:4223'],
      jwtSecret: 'supersecret',
    });
  });

  it('should throw an error if a required variable is missing', () => {
    process.env.PORT = '3000';
    process.env.NATS_SERVERS = 'nats://localhost:4222';
    delete process.env.JWT_SECRET;

    expect(() => require('./envs')).toThrow(/Config validation error/);
  });

  it('should throw an error if PORT is not a number', () => {
    process.env.PORT = 'not-a-number';
    process.env.NATS_SERVERS = 'nats://localhost:4222';
    process.env.JWT_SECRET = 'secret';

    expect(() => require('./envs')).toThrow(/Config validation error/);
  });

  it('should throw an error if NATS_SERVERS is empty', () => {
    process.env.PORT = '3000';
    process.env.NATS_SERVERS = '';
    process.env.JWT_SECRET = 'secret';

    expect(() => require('./envs')).toThrow(/Config validation error/);
  });
});
