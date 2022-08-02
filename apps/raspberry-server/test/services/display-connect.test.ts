import app from "../../src/app";

describe("'display-connect' service", () => {
  it("registered the service", () => {
    const service = app.service("display-connect");
    expect(service).toBeTruthy();
  });
});
