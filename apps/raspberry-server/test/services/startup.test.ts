import app from "../../src/app";
import intusAPI from "../../src/clients/intusAPI/intusAPI";

jest.mock("../../src/clients/intusAPI/intusAPI");
const mockedIntusAPI = jest.mocked(intusAPI);

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
    mockedIntusAPI.fetchRaspberryPosts.mockResolvedValue([]);
    const service = app.service("startup");
    expect(await service.create({})).toEqual({});
  });
});
