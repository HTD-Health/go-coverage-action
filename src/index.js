const core = require('@actions/core');
const github = require('@actions/github');

const {generateAnnotations, generateSummary} = require("./output");
const {generateCoverageDetails} = require("./coverage");

const run = async () => {
    const coverage = await generateCoverageDetails();
    const {success, message} = generateSummary(coverage);
    const annotations = generateAnnotations(coverage);

    const token = core.getInput('token');
    const repositoryName = process.env.GITHUB_REPOSITORY;
    const commitSHA = process.env.GITHUB_SHA;

    const firstBatchOfAnnotations = annotations.splice(0, 50);

    const octokit = github.getOctokit(token);
    const runDetails = await octokit.request(`POST /repos/${repositoryName}/check-runs`, {
        name: 'Code Coverage',
        head_sha: commitSHA,
        conclusion: success ? 'success' : 'failure',
        output: {
            title: message,
            summary: message,
            annotations: firstBatchOfAnnotations
        }
    })

    while (annotations.length !== 0) {
        const batch = annotations.splice(0, 50);
        await octokit.request(`PATCH /repos/${repositoryName}/check-runs/${runDetails.id}`, {
            output: {
                annotations: batch
            }
        })
    }
}

run().catch(err => core.setFailed(err));
