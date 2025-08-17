// Simple Health Check Test - Beginner Level
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Create a simple test app
const app = express();

// Add the health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'test'
  });
});

describe('Health Check API - Beginner Tests', () => {
  test('GET /health should return OK status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
  });

  test('Health check should return JSON content type', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.headers['content-type']).toMatch(/json/);
  });

  test('Health check should have timestamp in ISO format', async () => {
    const response = await request(app)
      .get('/health');

    const timestamp = response.body.timestamp;
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('Health check should have numeric uptime', async () => {
    const response = await request(app)
      .get('/health');

    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('Health check should return environment info', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.body.environment).toBeDefined();
    expect(typeof response.body.environment).toBe('string');
  });
});
