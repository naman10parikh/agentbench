import { describe, it, expect } from "vitest";
import {
  clamp,
  average,
  median,
  standardDeviation,
} from "../src/math-utils.js";

describe("clamp", () => {
  it("returns value when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when value is below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when value is above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min/max when value equals boundary", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("throws RangeError when min > max", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });

  it("works with negative ranges", () => {
    expect(clamp(-3, -10, -1)).toBe(-3);
  });

  it("works when min equals max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe("average", () => {
  it("calculates average of positive numbers", () => {
    expect(average([1, 2, 3, 4, 5])).toBe(3);
  });

  it("returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });

  it("returns the number for single-element array", () => {
    expect(average([42])).toBe(42);
  });

  it("handles negative numbers", () => {
    expect(average([-2, 2])).toBe(0);
  });

  it("handles floating point numbers", () => {
    expect(average([1.5, 2.5])).toBe(2);
  });
});

describe("median", () => {
  it("returns middle value for odd-length array", () => {
    expect(median([1, 3, 5])).toBe(3);
  });

  it("returns average of two middle values for even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("returns 0 for empty array", () => {
    expect(median([])).toBe(0);
  });

  it("returns the number for single-element array", () => {
    expect(median([7])).toBe(7);
  });

  it("handles unsorted input", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it("does not mutate original array", () => {
    const arr = [3, 1, 2];
    median(arr);
    expect(arr).toEqual([3, 1, 2]);
  });

  it("handles negative numbers", () => {
    expect(median([-5, -1, -3])).toBe(-3);
  });
});

describe("standardDeviation", () => {
  it("calculates standard deviation correctly", () => {
    const result = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2.138, 2);
  });

  it("returns 0 for single-element array", () => {
    expect(standardDeviation([5])).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(standardDeviation([])).toBe(0);
  });

  it("returns 0 for array of identical values", () => {
    expect(standardDeviation([3, 3, 3, 3])).toBe(0);
  });

  it("handles two-element array", () => {
    const result = standardDeviation([0, 10]);
    expect(result).toBeCloseTo(7.071, 2);
  });

  it("handles negative numbers", () => {
    const result = standardDeviation([-2, -1, 0, 1, 2]);
    expect(result).toBeCloseTo(1.581, 2);
  });
});
