const request = require('supertest');
const { app, createProject, registerAndLoginUser } = require('./helpers/testData');

describe('Tasks API', () => {
  describe('POST /api/tasks', () => {
    it('creates a task for an authenticated user', async () => {
      const { token } = await registerAndLoginUser({
        role: 'admin',
        email: 'admin-tasks@example.com',
      });

      const projectResponse = await createProject(token, { name: 'Tasks Project' });

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Write API tests',
          project: projectResponse.body._id,
          status: 'Todo',
          dueDate: '2030-12-31',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          title: 'Write API tests',
          status: 'Todo',
          dueDate: expect.any(String),
          project: expect.objectContaining({
            _id: projectResponse.body._id,
            name: 'Tasks Project',
          }),
        }),
      );
    });

    it('rejects task creation without authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Unauthorized task',
          project: '507f1f77bcf86cd799439011',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'No token provided',
        }),
      );
    });

    it('rejects task creation when title or project is missing', async () => {
      const { token } = await registerAndLoginUser({
        role: 'member',
        email: 'member-missing-task-fields@example.com',
      });

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'Todo',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Title and project required',
        }),
      );
    });
  });

  describe('GET /api/tasks', () => {
    it('returns tasks and supports status filtering', async () => {
      const { token } = await registerAndLoginUser({
        role: 'admin',
        email: 'admin-task-list@example.com',
      });

      const projectResponse = await createProject(token, { name: 'Filter Project' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Task Todo',
          project: projectResponse.body._id,
          status: 'Todo',
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Task Done',
          project: projectResponse.body._id,
          status: 'Done',
        });

      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'Done' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          title: 'Task Done',
          status: 'Done',
        }),
      );
    });

    it('returns tasks filtered by projectId', async () => {
      const { token } = await registerAndLoginUser({
        role: 'admin',
        email: 'admin-project-filter@example.com',
      });

      const firstProject = await createProject(token, { name: 'Alpha Project' });
      const secondProject = await createProject(token, { name: 'Beta Project' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Alpha Task',
          project: firstProject.body._id,
          status: 'Todo',
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Beta Task',
          project: secondProject.body._id,
          status: 'Todo',
        });

      const response = await request(app)
        .get('/api/tasks')
        .query({ projectId: secondProject.body._id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          title: 'Beta Task',
          project: expect.objectContaining({
            _id: secondProject.body._id,
          }),
        }),
      );
    });

    it('rejects task listing without a token', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'No token provided',
        }),
      );
    });
  });
});
