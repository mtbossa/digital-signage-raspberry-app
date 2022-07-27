import app from '../../src/app';

describe('\'server-status-checker\' service', () => {
  it('registered the service', () => {
    const service = app.service('server-status-checker');
    expect(service).toBeTruthy();
  });
});
