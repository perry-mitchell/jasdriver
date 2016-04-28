"use strict";

const DEBUG = false;

module.exports = [
    {
        closeDriverOnFinish: !DEBUG,
        exitOnFinish: !DEBUG,
        specs: [
            __dirname + "/tests"
        ],
        webdriverBrowser: "firefox"
    },
    {
        closeDriverOnFinish: !DEBUG,
        exitOnFinish: !DEBUG,
        specs: [
            __dirname + "/tests"
        ],
        webdriverBrowser: "chrome"
    }
];
