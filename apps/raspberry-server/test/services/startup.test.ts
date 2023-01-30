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

  it("should call ShowcaseChecker service create method", async () => {
    mockedIntusAPI.fetchRaspberryPosts.mockResolvedValue([]);

    const service = app.service("startup");
    const showcase = app.service("showcase-checker");
    const spy = jest.spyOn(showcase, "create");

    await service.create({});

    expect(spy).toHaveBeenCalled();
  });

  it("should call ShowcaseChecker service create method even if sync fails", async () => {
    mockedIntusAPI.fetchRaspberryPosts.mockRejectedValue(new Error("fail"));

    expect.assertions(1);

    const service = app.service("startup");
    const showcase = app.service("showcase-checker");
    const spy = jest.spyOn(showcase, "create");

    await service.create({});

    expect(spy).toHaveBeenCalled();
  });
});
