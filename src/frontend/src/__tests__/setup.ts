import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { vi } from "vitest";

// Generated components use `data-ocid` for test hooks; make it the default
// test id attribute so `getByTestId` works without per-test configuration.
configure({ testIdAttribute: "data-ocid" });

// `@caffeineai/object-storage` ships a broken internal import (`./blob`) that
// fails to resolve under Vitest's module graph. The app's generated `backend.ts`
// imports `ExternalBlob` from it, so any page that pulls in `@/backend` would
// otherwise fail to load. Provide a minimal stand-in for the test environment.
vi.mock("@caffeineai/object-storage", () => {
  class ExternalBlob {
    static fromBytes(bytes: Uint8Array, _type: string, _name: string) {
      return new ExternalBlob(bytes);
    }
    constructor(private bytes: Uint8Array) {}
    withUploadProgress() {
      return this;
    }
    async getBytes() {
      return this.bytes;
    }
  }
  return { ExternalBlob };
});
