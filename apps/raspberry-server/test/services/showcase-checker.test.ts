import app from "../../src/app";

describe("'showcaseChecker' service", () => {
  it("registered the service", () => {
    const service = app.service("showcase-checker");
    expect(service).toBeTruthy();
  });
});
