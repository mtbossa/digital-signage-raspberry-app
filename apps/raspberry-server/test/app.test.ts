import axios from "axios";
import { Server } from "http";
import url from "url";

import app from "../src/app";

const port = app.get("port") || 8998;
const getUrl = (pathname?: string): string =>
  url.format({
    hostname: app.get("host") || "localhost",
    protocol: "http",
    port,
    pathname,
  });

describe("Feathers application tests (with jest)", () => {
  let server: Server;

  beforeAll((done) => {
    server = app.listen(port);
    server.once("listening", () => done());
  });

  afterAll((done) => {
    server.close(done);
  });

  it("starts and shows the index page", async () => {
    expect.assertions(1);

    const { data } = await axios.get(getUrl());

    expect(data.indexOf('<html lang="en">')).not.toBe(-1);
  });
});
