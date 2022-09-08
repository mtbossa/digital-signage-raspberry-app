import app from '../../src/app';

describe('\'backend-channels-connector\' service', () => {
  it('registered the service', () => {
    const service = app.service('backend-channels-connector');
    expect(service).toBeTruthy();
  });
});
