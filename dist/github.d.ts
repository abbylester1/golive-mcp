import type { GitHubConfig } from "./types.js";
export interface CreatePrOptions {
    title: string;
    body?: string;
    base?: string;
    draft?: boolean;
}
export declare function getCurrentBranch(): string;
export declare function commitAll(message: string): void;
export declare function pushBranch(branch: string): void;
export declare function createPullRequest(config: GitHubConfig, opts: CreatePrOptions): string;
export declare function getPrUrl(config: GitHubConfig, branch: string): string;
