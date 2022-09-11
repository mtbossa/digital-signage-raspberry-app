import app from "../../src/app";

describe("'displays' service", () => {
  it("registered the service", () => {
    const service = app.service("displays");
    expect(service).toBeTruthy();
  });
});
