import { execSync } from "child_process";
export function getCurrentBranch() {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
}
export function commitAll(message) {
    execSync("git add -A", { stdio: "pipe" });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: "pipe" });
}
export function pushBranch(branch) {
    execSync(`git push -u origin "${branch}"`, { stdio: "pipe" });
}
export function createPullRequest(config, opts) {
    const { title, body, base = "main", draft = false } = opts;
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedBody = (body || "").replace(/"/g, '\\"');
    let args = `gh pr create --repo "${config.owner}/${config.repo}" --base "${base}" --title "${escapedTitle}"`;
    if (escapedBody)
        args += ` --body "${escapedBody}"`;
    if (draft)
        args += " --draft";
    return execSync(args, { encoding: "utf-8" }).trim();
}
export function getPrUrl(config, branch) {
    try {
        return execSync(`gh pr view "${branch}" --repo "${config.owner}/${config.repo}" --json url --jq .url`, { encoding: "utf-8" }).trim();
    }
    catch {
        return `https://github.com/${config.owner}/${config.repo}/pull/new/${branch}`;
    }
}
