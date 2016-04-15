"use strict";

const chalk = require("chalk");

module.exports = function log(type, items) {
    items = Array.isArray(items) ? items : [items];
    let output;
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
        case "info":
            /* falls-through */
        default:
            output = chalk.white("<") + chalk.gray.bold("info") + chalk.white(">");
            break;
    }
    console.log.apply(console, [output].concat(items));
};
