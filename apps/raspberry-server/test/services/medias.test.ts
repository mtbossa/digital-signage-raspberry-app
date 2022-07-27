import app from '../../src/app';

describe('\'medias\' service', () => {
  it('registered the service', () => {
    const service = app.service('medias');
    expect(service).toBeTruthy();
  });
});
