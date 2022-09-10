import app from "../../src/app";

describe("'media-posts' service", () => {
  it("registered the service", () => {
    const service = app.service("media-posts");
    expect(service).toBeTruthy();
  });
});
