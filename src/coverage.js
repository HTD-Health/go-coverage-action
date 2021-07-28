const readline = require('readline');
const exec = require('@actions/exec');
const fs = require('fs').promises;

const parseProfileLine = (line) => {
    let [ fileName, startLine, startColumn, endLine, endColumn, statements, count ] = line.split(/[\s:,.]+/);
    startLine = +startLine;
    startColumn = +startColumn;
    endLine = +endLine;
    endColumn = +endColumn;
    statements = +statements;
    count = +count;

    return {
        fileName, startLine, startColumn, endLine, endColumn, statements, count
    }
}

const parseProfile = async (data) => {
    const rl = readline.createInterface({
        input: data,
        crlfDelay: Infinity
    });

    await rl.next(); // skip mode line

    const missingCoverage = [];
    let totalStatements = 0;
    let totalTested = 0;

    for await (const line of rl) {
        const { fileName, startLine, startColumn, endLine, endColumn, statements, count } = parseProfileLine(line);

        // For calculating coverage
        totalStatements += +statements;
        if (+count === 1) {
            totalTested += +statements;
            continue;
        }

        missingCoverage.push({
            fileName,
            startLine,
            startColumn,
            endLine,
            endColumn,
            statements,
            count
        });
    }

    return {
        totalStatements,
        totalTested,
        missingCoverage
    }
}

const generateCoverageDetails = async () => {
    await exec.exec('go', ['test', '-coverprofile', '/tmp/cover.out', './...']);

    const data = await fs.readFile('/tmp/cover.out');
    return parseProfile(data);
}

module.exports = {
    generateCoverageDetails
}
