// web/src/services/system.ts
import { get } from "./http";

export type VersionInfo = {
  version: string;
  commit: string;
  builtAt: string;
};

const System = {
  version: () => get<VersionInfo>("version"), // -> /api/v1/version
  // later: status/readiness if we add /api/v1/status & /api/v1/readiness
};

export default System;
