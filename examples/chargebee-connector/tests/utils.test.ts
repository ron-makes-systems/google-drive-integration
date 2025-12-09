import {describe, test, expect} from "vitest";
import {minToSec, SecToMin, getCustomerName, validateSubdomainInput} from "../src/utils/data.js";

describe("minToSec", () => {
  test("should convert minutes to seconds correctly", () => {
    expect(minToSec(60)).toBe(60000);
    expect(minToSec(0)).toBe(0);
    expect(minToSec(-1)).toBe(-1000);
    expect(minToSec(undefined)).toBeUndefined();
  });
});

describe("SecToMin", () => {
  test("should convert seconds to minutes correctly", () => {
    expect(SecToMin("60000")).toBe("60");
    expect(SecToMin("0")).toBe("0");
    expect(SecToMin("-1000")).toBe("-1");
    expect(SecToMin(undefined)).toBeUndefined();
  });
});

describe("getCustomerName", () => {
  test("should return first name and last name if both are provided", () => {
    expect(getCustomerName("123", "John", "Doe")).toBe("John Doe");
  });

  test("should return email if first name and last name are not provided", () => {
    expect(getCustomerName("123", undefined, undefined, "john.doe@example.com")).toBe("john.doe@example.com");
  });

  test("should return customer ID if neither first name, last name, nor email is provided", () => {
    expect(getCustomerName("123")).toBe("123");
  });

  test("should return customer ID if first name and last name are empty strings", () => {
    expect(getCustomerName("123", "", "")).toBe("123");
  });

  test("should return customer ID if email is empty string", () => {
    expect(getCustomerName("123", undefined, undefined, "")).toBe("123");
  });
});

describe("validateSubdomainInput", () => {
  test("should accept valid subdomain", () => {
    expect(() => validateSubdomainInput("fibery-test")).not.toThrow();
    expect(() => validateSubdomainInput("my-company123")).not.toThrow();
    expect(() => validateSubdomainInput("testcompany")).not.toThrow();
  });

  test("should throw error for empty input", () => {
    expect(() => validateSubdomainInput()).toThrow("Site is empty");
    expect(() => validateSubdomainInput("")).toThrow("Site is empty");
    expect(() => validateSubdomainInput("  ")).toThrow("Site is empty");
  });

  test("should throw error for full URLs with suggestion", () => {
    // HTTPS URLs
    expect(() => validateSubdomainInput("https://fibery-test.chargebee.com")).toThrow(
      "Please enter just the subdomain instead of the full URL (suggestion: 'fibery-test')",
    );

    expect(() => validateSubdomainInput("https://my-company.chargebee.com/some/path")).toThrow(
      "Please enter just the subdomain instead of the full URL (suggestion: 'my-company')",
    );

    // HTTP URLs
    expect(() => validateSubdomainInput("http://test-corp.chargebee.com")).toThrow(
      "Please enter just the subdomain instead of the full URL (suggestion: 'test-corp')",
    );

    // Domain without protocol
    expect(() => validateSubdomainInput("mysite.chargebee.com")).toThrow(
      "Please enter just the subdomain instead of the full URL (suggestion: 'mysite')",
    );
  });

  test("should handle edge cases", () => {
    // Valid subdomain with spaces around it
    expect(() => validateSubdomainInput("  valid-subdomain  ")).not.toThrow();

    // Valid subdomain with mixed case
    expect(() => validateSubdomainInput("MyCompany-Test")).not.toThrow();
  });

  test("should handle non-chargebee URLs", () => {
    expect(() => validateSubdomainInput("https://example.com")).not.toThrow(); // Not a chargebee.com domain, so should be treated as invalid subdomain

    expect(() => validateSubdomainInput("test.example.com")).not.toThrow(); // Not a chargebee.com domain
  });
});
