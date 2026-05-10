import request from 'supertest';

// Mock Bags service to avoid real API calls
jest.mock('../src/services/bags.service', () => ({
  getTokenCreators: jest.fn().mockResolvedValue({
    mint: 'TEST_MINT_1234',
    name: 'TestToken',
    symbol: 'TTK',
    royalty_percentage: 2.5,
    creators: [
      { wallet: 'WALLET_ABC', role: 'creator', royalty_percentage: 2.5 },
    ],
  }),
  getTokenLifetimeFees: jest.fn().mockResolvedValue({
    mint: 'TEST_MINT_1234',
    fee_lifetime_amount: 5000,
  }),
  discoverTokenMints: jest.fn().mockResolvedValue(['TEST_MINT_1234']),
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    ecosystemToken: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({
        mint: 'TEST_MINT_1234',
        name: 'TestToken',
        creators: [],
        riskScores: [],
      }),
      findMany: jest.fn().mockResolvedValue([{ mint: 'TEST_MINT_1234' }]),
    },
    tokenCreator: { upsert: jest.fn().mockResolvedValue({}) },
    riskScore: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
    syncLog: { create: jest.fn().mockResolvedValue({}) },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

import app from '../src/app';

describe('GET /api/bags/creators', () => {
  it('returns 400 when mint is missing', async () => {
    const res = await request(app).get('/api/bags/creators');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mint/i);
  });

  it('returns enriched token data for valid mint', async () => {
    const res = await request(app).get('/api/bags/creators?mint=TEST_MINT_1234');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mint', 'TEST_MINT_1234');
  });
});

describe('GET /api/bags/fees', () => {
  it('returns 400 when mint is missing', async () => {
    const res = await request(app).get('/api/bags/fees');
    expect(res.status).toBe(400);
  });

  it('returns fee data for valid mint', async () => {
    const res = await request(app).get('/api/bags/fees?mint=TEST_MINT_1234');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('fee_lifetime_amount');
  });
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
