import type { UnitTypes } from "../../src/providers/DateProvider";
import DayjsDateProvider from "../../src/providers/implementations/DayjsDateProvider";

describe("Dayjs provider", () => {
  const dayjsDateProvider = new DayjsDateProvider();

  describe("Normal cases - Start and end on same day", () => {
    describe("Now fake date and time: 2022-01-01 05:30:00", () => {
      const nowFakeTime = "05:30:00";
      const nowFakeDate = "2022-01-01";
      const nowCompleteFakeDate = `${nowFakeDate} ${nowFakeTime}`;
      jest.useFakeTimers().setSystemTime(new Date(nowCompleteFakeDate));

      describe("isDateAfterToday()", () => {
        describe("Should return true when", () => {
          it("Compare date: 2022-01-02", () => {
            const dateToCompare = "2022-01-02";

            expect(dayjsDateProvider.isDateAfterToday(dateToCompare)).toBe(true);
          });
        });
        describe("Should return false when", () => {
          it(`Compare date: ${nowFakeDate} 05:35:00`, () => {
            expect(dayjsDateProvider.isDateAfterToday(`${nowFakeDate} 05:35:00`)).toBe(
              false
            );
          });

          it("Compare date: 2021-12-31", () => {
            const dateToCompare = "2021-12-31";

            expect(dayjsDateProvider.isDateAfterToday(dateToCompare)).toBe(false);
          });
        });
      });

      describe("isDateBeforeToday()", () => {
        describe("Should return true when", () => {
          it("Compare date: 2021-12-31", () => {
            const dateToCompare = "2021-12-31";

            expect(dayjsDateProvider.isDateBeforeToday(dateToCompare)).toBe(true);
          });
        });
        describe("Should return false when", () => {
          it(`Compare date: ${nowFakeDate}`, () => {
            expect(dayjsDateProvider.isDateBeforeToday(`${nowFakeDate} 05:29:00`)).toBe(
              false
            );
          });

          it(`Compare date: 2022-01-02`, () => {
            const dateToCompare = "2022-01-02";

            expect(dayjsDateProvider.isDateBeforeToday(dateToCompare)).toBe(false);
          });
        });
      });

      describe("isNowBetweenTimes()", () => {
        describe("Should return true when", () => {
          it("Start Time: 04:40:00 | End Time: 06:50:00", () => {
            const startTime = "04:40:00";
            const endTime = "06:50:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(true);
          });

          it("Start Time: 05:29:00 | End Time: 05:31:00", () => {
            const startTime = "05:29:00";
            const endTime = "05:31:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(true);
          });

          it("Start Time: 04:29:00 | End Time: 06:31:00", () => {
            const startTime = "04:29:00";
            const endTime = "06:31:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(true);
          });

          it("Start Time: 05:30:00 | End Time: 05:31:00", () => {
            const startTime = "05:30:00";
            const endTime = "05:31:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(true);
          });
        });

        describe("Should return false when", () => {
          it(`Start Time: 06:29:00 | End Time: 06:31:00`, () => {
            const startTime = "06:29:00";
            const endTime = "06:31:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(false);
          });

          it(`Start Time: 04:29:00 | End Time: 04:31:00`, () => {
            const startTime = "04:29:00";
            const endTime = "04:31:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(false);
          });

          it(`Start Time: 05:31:00 | End Time: 05:40:00`, () => {
            const startTime = "05:31:00";
            const endTime = "05:40:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(false);
          });

          it(`Start Time: 05:20:00 | End Time: 05:29:00`, () => {
            const startTime = "05:20:00";
            const endTime = "05:29:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(false);
          });

          it(`Start Time: 05:25:00 | End Time: 05:30:00`, () => {
            const startTime = "05:25:00";
            const endTime = "05:30:00";
            expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(false);
          });
        });
      });
    });
  });
  describe("Special cases - Start on one day and finishes in the next one", () => {
    afterEach(() => {
      jest.clearAllTimers();
    });

    describe("Should return true", () => {
      it(`Now time: 2022-01-01 00:00:00 | Start Time: 23:15:00 | End Time: 00:30:00`, () => {
        const nowFakeTime = "00:00:00";
        const nowFakeDate = "2022-01-01";
        const nowCompleteFakeDate = `${nowFakeDate} ${nowFakeTime}`;
        jest.useFakeTimers().setSystemTime(new Date(nowCompleteFakeDate));

        const startTime = "23:15:00";
        const endTime = "00:30:00";
        expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(true);
      });

      it(`Now time: 2022-01-01 00:00:00 | Start Time: 23:15:00 | End Time: 23:14:00`, () => {
        const nowFakeTime = "00:00:00";
        const nowFakeDate = "2022-01-01";
        const nowCompleteFakeDate = `${nowFakeDate} ${nowFakeTime}`;
        jest.useFakeTimers().setSystemTime(new Date(nowCompleteFakeDate));

        const startTime = "23:15:00";
        const endTime = "23:14:00";
        expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(true);
      });
      it(`Now time: 2022-01-01 23:59:59 | Start Time: 23:25:00 | End Time: 00:30:00`, () => {
        const nowFakeTime = "23:59:59";
        const nowFakeDate = "2022-01-01";
        const nowCompleteFakeDate = `${nowFakeDate} ${nowFakeTime}`;

        jest.useFakeTimers().setSystemTime(new Date(nowCompleteFakeDate));

        const startTime = "23:15:00";
        const endTime = "00:30:00";
        expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(true);
      });
    });
    describe("Should return false", () => {
      it(`Now time: 2022-01-01 22:24:00 | Start Time: 22:25:00 | End Time: 01:30:00`, () => {
        const nowFakeTime = "22:24:00";
        const nowFakeDate = "2022-01-01";
        const nowCompleteFakeDate = `${nowFakeDate} ${nowFakeTime}`;

        jest.useFakeTimers().setSystemTime(new Date(nowCompleteFakeDate));

        const startTime = "22:25:00";
        const endTime = "01:30:00";
        expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(false);
      });

      it(`Now time: 2022-01-01 01:31:00 | Start Time: 22:25:00 | End Time: 01:30:00`, () => {
        const nowFakeTime = "01:31:00";
        const nowFakeDate = "2022-01-01";
        const nowCompleteFakeDate = `${nowFakeDate} ${nowFakeTime}`;

        jest.useFakeTimers().setSystemTime(new Date(nowCompleteFakeDate));

        const startTime = "22:25:00";
        const endTime = "01:30:00";
        expect(dayjsDateProvider.isNowBetweenTimes(startTime, endTime)).toBe(false);
      });
    });
  });
  describe("isTodaySameUnitValue()", () => {
    const isSameUnitValueTests = [
      {
        expectation: true,
        tests: [
          {
            unitValue: {
              unit: "day",
              value: 1,
            },
            nowDate: new Date("2022-01-01 00:00:00"),
            skip: false,
          },
          {
            unitValue: {
              unit: "isoweekday",
              value: 1,
            },
            nowDate: new Date("2022-01-03 00:00:00"),
            skip: false,
          },
          {
            unitValue: {
              unit: "month",
              value: 1,
            },
            nowDate: new Date("2022-01-03 00:00:00"),
            skip: false,
          },
          {
            unitValue: {
              unit: "month",
              value: 1,
            },
            nowDate: new Date("2022-01-03 00:00:00"),
            skip: false,
          },
          {
            unitValue: {
              unit: "year",
              value: 2022,
            },
            nowDate: new Date("2022-01-03 00:00:00"),
            skip: false,
          },
        ],
      },
      {
        expectation: false,
        tests: [
          {
            unitValue: {
              unit: "date",
              value: 1,
            },
            nowDate: new Date("2022-01-02 00:00:00"),
            skip: false,
          },
          {
            unitValue: {
              unit: "isoWeekday",
              value: 1,
            },
            nowDate: new Date("2022-01-04 00:00:00"),
            skip: false,
          },
          {
            unitValue: {
              unit: "month",
              value: 0,
            },
            nowDate: new Date("2022-02-04 00:00:00"),
            skip: false,
          },
          {
            unitValue: {
              unit: "year",
              value: 2021,
            },
            nowDate: new Date("2022-02-04 00:00:00"),
            skip: false,
          },
        ],
      },
    ];

    isSameUnitValueTests.forEach((expectation) => {
      describe(`Expectations: ${expectation.expectation}`, () => {
        expectation.tests.forEach((test) => {
          if (test.skip) return;

          it(`Now date: ${test.nowDate} | Unit: ${test.unitValue.unit} | Value: ${test.unitValue.value}`, () => {
            jest.useFakeTimers().setSystemTime(new Date(test.nowDate));

            expect(
              dayjsDateProvider.isTodaySameUnitValue(
                test.unitValue.value,
                test.unitValue.unit as UnitTypes
              )
            ).toEqual(expectation.expectation);
          });
        });
      });
    });
  });
});
