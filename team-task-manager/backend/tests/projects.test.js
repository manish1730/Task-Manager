const request = require('supertest');
const { app, registerAndLoginUser } = require('./helpers/testData');

describe('Projects API', () => {
  describe('POST /api/projects', () => {
    it('allows an admin to create a project', async () => {
      const { token, user } = await registerAndLoginUser({
        role: 'admin',
        email: 'admin-projects@example.com',
      });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Backend QA Project' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: 'Backend QA Project',
          createdBy: expect.objectContaining({
            _id: user.id,
            role: 'admin',
          }),
        }),
      );
      expect(Array.isArray(response.body.members)).toBe(true);
    });

    it('rejects project creation without a token', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Unauthorized Project' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'No token provided',
        }),
      );
    });

    it('rejects project creation for non-admin users', async () => {
      const { token } = await registerAndLoginUser({
        role: 'member',
        email: 'member-projects@example.com',
      });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Member Project' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Access denied',
        }),
      );
    });

    it('rejects project creation when name is missing', async () => {
      const { token } = await registerAndLoginUser({
        role: 'admin',
        email: 'admin-missing-project-name@example.com',
      });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Project name required',
        }),
      );
    });
  });

  describe('GET /api/projects', () => {
    it('returns projects created by the current user', async () => {
      const { token } = await registerAndLoginUser({
        role: 'admin',
        email: 'admin-project-list@example.com',
      });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Project One' });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Project Two' });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          createdBy: expect.objectContaining({
            name: expect.any(String),
            email: expect.any(String),
          }),
        }),
      );
    });

    it('rejects project listing without a token', async () => {
      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'No token provided',
        }),
      );
    });
  });
});
