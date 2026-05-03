const request = require('supertest');
const { app } = require('./helpers/testData');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new member and returns a JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Tester',
          email: 'alice@example.com',
          password: 'password123',
          role: 'member',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(String),
            name: 'Alice Tester',
            role: 'member',
          }),
        }),
      );
    });

    it('rejects registration when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Missing Password',
          email: 'missing@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'All fields required',
        }),
      );
    });

    it('rejects duplicate email registration', async () => {
      const payload = {
        name: 'Bob Duplicate',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'member',
      };

      await request(app).post('/api/auth/register').send(payload);
      const response = await request(app).post('/api/auth/register').send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Email already in use',
        }),
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in an existing user and returns a JWT token', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Charlie Login',
          email: 'charlie@example.com',
          password: 'password123',
          role: 'admin',
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'charlie@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(String),
            name: 'Charlie Login',
            role: 'admin',
          }),
        }),
      );
    });

    it('rejects login with invalid credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dana Wrong Password',
          email: 'dana@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dana@example.com',
          password: 'incorrect-password',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Invalid credentials',
        }),
      );
    });

    it('rejects login when email or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'All fields required',
        }),
      );
    });
  });
});
