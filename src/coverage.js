const readline = require('readline');
const stream = require('stream');
const exec = require('@actions/exec');
const fs = require('fs').promises;

const parseProfileLine = (line) => {
    const matchResult = line.match(/(?<fileName>.+):(?<startLine>[0-9]+).(?<startColumn>[0-9]+),(?<endLine>[0-9]+).(?<endColumn>[0-9]+) (?<statements>[0-9]+) (?<count>[0-9]+)/);
    if (!matchResult) {
        return null;
    }

    let {
        fileName,
        startLine,
        startColumn,
        endLine,
        endColumn,
        statements,
        count
    } = matchResult.groups;

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
    const bufferStream = new stream.PassThrough();
    bufferStream.end(data);

    const rl = readline.createInterface({
        input: bufferStream,
        crlfDelay: Infinity
    });

    const missingCoverage = [];
    let totalStatements = 0;
    let totalTested = 0;

    for await (const line of rl) {
        const parseResult = parseProfileLine(line);
        if (!parseResult) {
            continue;
        }

        const {fileName, startLine, startColumn, endLine, endColumn, statements, count} = parseResult;

        // For calculating coverage
        totalStatements += statements;
        if (count === 1) {
            totalTested += statements;
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
    const testResult = await exec.exec('go', ['test', '-coverprofile', '/tmp/cover.out', './...']);
    if (testResult !== 0) {
        throw new Error("Tests failed");
    }

    const data = await fs.readFile('/tmp/cover.out');
    return parseProfile(data);
}

module.exports = {
    generateCoverageDetails
}
