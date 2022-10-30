import app from "../../src/app";

describe("'startup' service", () => {
  afterEach(() => {
    app.service("server-status-checker").stop();
    app.service("showcase-checker").stop();
  });
  it("registered the service", () => {
    const service = app.service("startup");
    expect(service).toBeTruthy();
  });

  it("test", async () => {
    const service = app.service("startup");
    expect(await service.create({})).toEqual({});
  });
});
