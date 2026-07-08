export interface SpaceshipConfig {
    host: string;
    user: string;
    password: string;
    remotePath: string;
    cageFsPath?: string;
    phpCopyUrl?: string;
}
export interface VercelConfig {
    token: string;
    projectId: string;
    orgId: string;
}
export interface BuildConfig {
    command: string;
    cwd?: string;
}
export interface DeployTarget {
    provider: "spaceship" | "vercel" | "custom";
    build: BuildConfig;
    spaceship?: SpaceshipConfig;
    vercel?: VercelConfig;
    custom?: string[];
    healthCheckUrl?: string;
}
export interface GitHubConfig {
    owner: string;
    repo: string;
}
export interface DeployConfig {
    github: GitHubConfig;
    targets: Record<string, DeployTarget>;
}
