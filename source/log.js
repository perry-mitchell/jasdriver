"use strict";

const chalk = require("chalk");
const padStdio = require("pad-stdio");
const PrettyError = require("pretty-error");

const INDENTATION = "   ";

function convertError(obj) {
    let err = new Error(obj.message);
    err.name = obj.name;
    err.stack = obj.stack;
    return err;
}

function getPaddingForIndent(indent) {
    let text = "";
    while (indent > 0) {
        indent -= 1;
        text += INDENTATION;
    }
    return text;
}

function isError(obj) {
    return (obj && obj.type === "jasdriver_error");
}

function trimTermColour(text, start, end) {
    start = (start === undefined || start === true);
    end = (end === undefined || end === true);
    if (start) {
        text = text.replace(/^(\x1B[[(?);]{0,2}(;?\d)*.|\s)+/, "");
    }
    if (end) {
        text = text.replace(/(\x1B[[(?);]{0,2}(;?\d)*.|\s)+$/, "");
    }
    return text;
}

let prettyError = new PrettyError();
// prettyError.appendStyle({
//     'pretty-error > header > title > kind': {
//         display: 'none'
//     },
//     'pretty-error > header > colon': {
//         display: 'none'
//     }
// });

module.exports = function log(type, items) {
    items = Array.isArray(items) ? items : [items];
    let output,
        errors = [];
    items = items.filter(function(item) {
        if (isError(item)) {
            errors.push(convertError(item));
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
            output = (items.length > 0) ?
                chalk.white.bold("<") + chalk.red.bold("error") + chalk.white.bold(">") :
                false;
            break;
        case "exception":
            output = chalk.white.bold("Ex");
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
                msgIndent = items[1] + 2;

            padStdio.stdout(getPaddingForIndent(msgIndent));
            console.log(chalk.dim(failureMsg));
            padStdio.stdout();

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
        let errorText = "" + prettyError.render(error);
        console.log(
            "\n" +
            trimTermColour(errorText, false, true) +
            "\n"
        );
    });
};
