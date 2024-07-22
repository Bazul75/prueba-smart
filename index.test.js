import { app, startServer } from '.';
import request from 'supertest';
import User from './users/model.js';
import sequelize from './shared/database/database.js';
import { Sequelize } from 'sequelize';

describe('User', () => {
  let data;
  let mockedSequelize;
  let server;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn());
    jest.spyOn(sequelize, 'log').mockImplementation(jest.fn());
    mockedSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });
    await mockedSequelize.sync({ force: true });
    server = await startServer();
  });

  afterAll(async () => {
    jest.clearAllMocks();
    await mockedSequelize.close();
    server.close();
  });

  beforeEach(() => {
    data = {
      "dni": "1234567890",
      "name": "Test"
    };
  });

  test('Get users', async () => {
    jest.spyOn(User, 'findAll').mockResolvedValue([data]);
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([data]);
  });

  test('Get user', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue({ ...data, id: 1 });
    const response = await request(app).get('/api/users/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...data, id: 1 });
  });

  test('Create user', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({ ...data, id: 1 });
    const response = await request(app).post('/api/users').send(data);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ...data, id: 1 });
  });
});