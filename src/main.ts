import * as core from "@actions/core";
import * as github from "@actions/github";
import { groupTable } from "./table";
import { DefaultArtifactClient } from "@actions/artifact";

const SIG = "<!-- bot: beni69/artifact-link -->";

const dbg = (thing: any, grp?: string) => {
    grp && core.startGroup(grp);
    core.debug(JSON.stringify(thing, undefined, 2));
    grp && core.endGroup();
};

async function run(): Promise<void> {
    try {
        const token = core.getInput("token", { required: true });
        const octokit = github.getOctokit(token);
        const artifact = new DefaultArtifactClient();

        dbg(github.context, "ctx");

        const {
            runId,
            repo: { owner, repo },
            sha,
        } = github.context;
        const link = `https://nightly.link/${owner}/${repo}/actions/runs/${runId}`;
        dbg(link);

        const { artifacts: af } = await artifact.listArtifacts();
        dbg(af, "artifacts");
        if (!af.length) {
            return core.error(`No artifacts found`);
        }

        // construct markdown
        let md = `${SIG}\n### Artifacts\n\n`;
        if (af.length > 1) md += `[View all](${link})\n`;
        const regex = core.getInput("group");
        dbg(regex);
        if (regex) {
            md +=
                groupTable(
                    af.map(a => a.name),
                    new RegExp(regex),
                    x => `[Download](${link}/${x}.zip)`
                ) + "\n";
        } else
            for (const a of af) {
                md += `- [${a.name}](${link}/${a.name}.zip)\n`;
            }

        // workflow summary
        const summary = core.getBooleanInput("summary");
        if (summary) core.summary.addRaw(md).write();

        // comment on commit
        const docc = core.getBooleanInput("commit");
        if (docc) {
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
        }

        // comment on pr
        const dopr = core.getBooleanInput("pr");
        if (dopr) {
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
        }
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();
