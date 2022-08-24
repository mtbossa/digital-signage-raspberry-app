import app from '../../src/app';

describe('\'posts-sync\' service', () => {
  it('registered the service', () => {
    const service = app.service('posts-sync');
    expect(service).toBeTruthy();
  });
});
