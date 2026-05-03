const request = require('supertest');
const app = require('../../app');

async function registerAndLoginUser(overrides = {}) {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const user = {
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${uniqueSuffix}@example.com`,
    password: overrides.password || 'password123',
    role: overrides.role || 'member',
  };

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(user);

  return {
    credentials: user,
    registerResponse,
    token: registerResponse.body.token,
    user: registerResponse.body.user,
  };
}

async function createProject(token, payload = {}) {
  return request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: payload.name || 'QA Project',
      ...payload,
    });
}

module.exports = {
  app,
  createProject,
  registerAndLoginUser,
};
