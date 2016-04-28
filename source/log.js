"use strict";

const chalk = require("chalk");
const PrettyError = require("pretty-error");
const truwrap = require("truwrap");

const INDENTATION = "   ";

function getPaddingForIndent(indent) {
    let text = "";
    while (indent > 0) {
        indent -= 1;
        text += INDENTATION;
    }
    return text;
}

function isError(obj) {
    let name = (obj && obj.name) ? obj.name.toLowerCase() : "";
    return obj && obj.message && (name.indexOf("error") >= 0 || name.indexOf("exception") >= 0);
}

let prettyError = new PrettyError();
prettyError.appendStyle({
    'pretty-error > header > title > kind': {
        display: 'none'
    },
    'pretty-error > header > colon': {
        display: 'none'
    }
});

module.exports = function log(type, items) {
    items = Array.isArray(items) ? items : [items];
    let output,
        errors = [];
    items = items.filter(function(item) {
        if (isError(item)) {
            errors.push(item);
            return false;
        }
        return true;
    });
    switch(type) {
        case "log":
            output = chalk.white.bold("<") + chalk.blue.bold("log") + chalk.white.bold(">");
            break;
        case "warning":
            /* falls-through */
        case "warn":
            output = chalk.white.bold("<") + chalk.yellow.bold("warn") + chalk.white.bold(">");
            break;
        case "error":
            output = chalk.white.bold("<") + chalk.red.bold("error") + chalk.white.bold(">");
            break;
        case "fatal":
            output = chalk.yellow.bold("<") + chalk.red.bold("fatal") + chalk.yellow.bold(">");
            break;
        case "spec_result":
            let description = items[0],
                status = items[1],
                indenting = items[2],
                statusText = "";
            if (status === "passed") {
                statusText = chalk.green("✔");
            } else if (status === "pending") {
                statusText = chalk.yellow("☉");
            } else if (status === "failed") {
                statusText = chalk.red("✘");
            }
            output = getPaddingForIndent(indenting) + INDENTATION + statusText + " " + description;
            items = "";
            break;
        case "spec_failure":
            let failureMsg = items[0],
                msgIndent = items[1] + 2,
                writer = truwrap({
                    left: (INDENTATION.length * msgIndent),
                    right: 1,
                    mode: 'soft'//,
                    //outStream: process.stdout
                });
            writer.write(chalk.dim(failureMsg) + "\n");
            writer.end();
            output = false;
            break;
        case "suite":
            output = getPaddingForIndent(items[1]) + chalk.bold.underline(items[0]);
            items = "";
            break;
        case "info":
            /* falls-through */
        default:
            output = chalk.white("<") + chalk.gray.bold("info") + chalk.white(">");
            break;
    }
    if (output) {
        console.log.apply(console, [output].concat(items));
    }
    errors.forEach(function(error) {
        console.log(prettyError.render(error));
    });
};
