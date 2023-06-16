import * as core from "@actions/core";
import * as github from "@actions/github";
import { DownloadHttpClient } from "@actions/artifact/lib/internal/download-http-client";

const SIG = "<!-- bot: beni69/artifact-link -->";

const dbg = (thing: any, grp?: string) => {
    grp && core.startGroup(grp);
    core.info(JSON.stringify(thing, undefined, 2));
    grp && core.endGroup();
};

async function run(): Promise<void> {
    try {
        const token = core.getInput("token");
        const octokit = github.getOctokit(token);

        dbg(github.context, "ctx");

        const {
            runId,
            repo: { owner, repo },
            sha,
        } = github.context;
        const link = `https://nightly.link/${owner}/${repo}/actions/runs/${runId}`;
        dbg(link);

        const { value: af } = await new DownloadHttpClient().listArtifacts();
        dbg(af, "artifacts");
        if (!af.length) {
            return core.error(`No artifacts found`);
        }

        // construct markdown
        let md = `${SIG}\n### Artifacts\n\n[View all](${link})\n`;
        for (const a of af) {
            md += `- [${a.name}](${link}/${a.name}.zip)\n`;
        }

        // maybe add workflow summary
        const summary = core.getBooleanInput("summary");
        if (summary) core.summary.addRaw(md).write();

        // comment on commit
        const cc = await octokit.rest.repos
            .listCommentsForCommit({
                owner,
                repo,
                commit_sha: sha,
            })
            .then(l => l.data.find(c => c.body.includes(SIG)));
        dbg(cc);
        if (cc)
            await octokit.rest.repos.updateCommitComment({
                owner,
                repo,
                comment_id: cc.id,
                body: md,
            });
        else
            await octokit.rest.repos.createCommitComment({
                owner,
                repo,
                commit_sha: sha,
                body: md,
            });

        // comment on pr
        if (github.context.eventName.startsWith("pull_request")) {
            const pr = github.context.payload.pull_request!.number;
            const prc = await octokit.rest.issues
                .listComments({
                    owner,
                    repo,
                    issue_number: pr,
                })
                .then(l => l.data.find(c => c.body?.includes(SIG)));
            dbg(prc);
            if (prc)
                await octokit.rest.issues.updateComment({
                    owner,
                    repo,
                    comment_id: prc.id,
                    body: md,
                });
            else
                await octokit.rest.issues.createComment({
                    owner,
                    repo,
                    issue_number: pr,
                    body: md,
                });
        }
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();
