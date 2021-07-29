const core = require('@actions/core');

const generateSummary = (coverage) => {
    const coverageValue = coverage.totalTested / coverage.totalStatements;
    const percentage = Math.round((coverageValue * 100 + Number.EPSILON) * 100) / 100;

    const targetPercentage = +core.getInput('min_coverage');
    if (percentage < targetPercentage) {
        return {
            success: false,
            message: `Coverage is ${percentage}% but should be ${targetPercentage}%`
        }
    }

    return {
        success: true,
        message: `Great! Coverage is ${percentage}%`
    }
}

const generateAnnotations = (coverage) => {
    return coverage.missingCoverage.map(entry => {
        const coverageValue = entry.statements / coverage.totalStatements;
        const percentage = Math.round((coverageValue * 100 + Number.EPSILON) * 100) / 100;

        const repositoryName = process.env.GITHUB_REPOSITORY;
        const modulePrefix = `github.com/${repositoryName}/`;
        const fileName = entry.fileName.substring(modulePrefix.length);

        return {
            path: fileName,
            start_line: entry.startLine,
            end_line: entry.endLine,
            annotation_level: 'warning',
            message: `This part of code is not tested. Testing will increase coverage by ${percentage}%`
        }
    })
}

module.exports = {
    generateAnnotations,
    generateSummary
}
