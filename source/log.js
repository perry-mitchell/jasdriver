"use strict";

const chalk = require("chalk");
const PrettyError = require("pretty-error");

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
            let padding = "\t";
            while (indenting > 0) {
                padding += "\t";
                indenting -= 1;
            }
            output = "\t" + statusText + " " + description;
            items = "";
            break;
        case "suite":
            output = "Suite: ";
            break;
        case "info":
            /* falls-through */
        default:
            output = chalk.white("<") + chalk.gray.bold("info") + chalk.white(">");
            break;
    }
    console.log.apply(console, [output].concat(items));
    errors.forEach(function(error) {
        console.log(prettyError.render(error));
    });
};
