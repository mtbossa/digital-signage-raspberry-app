import app from "../../src/app";

describe("'startup' service", () => {
  it("registered the service", () => {
    const service = app.service("startup");
    expect(service).toBeTruthy();
  });
});
