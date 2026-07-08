import type { SpaceshipConfig, BuildConfig } from "../types.js";
export declare function deploySpaceship(build: BuildConfig, config: SpaceshipConfig, healthCheckUrl?: string): Promise<string[]>;
