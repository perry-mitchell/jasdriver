"use strict";

const log = require("./log.js");
const table = require("table").default;

function formatStack(stackText) {
    return stackText.replace(/^[^\n]*?Error[^\n]*/, "");
}

function isError(obj) {
    return obj && obj.message && obj.name.toLowerCase().indexOf("error") >= 0;
}

class JasDriver {

    constructor(webdriverInstance, config) {
        this.driver = webdriverInstance;
        this.config = config;
        this.complete = false;
        this._completionCallbacks = [];
    }

    checkStatus() {
        this.driver.executeScript(function() {
            return window.testCompleted;
        })
        .then((completed) => {
            if (completed) {
                clearInterval(this.logWatch);
                return this.driver.executeScript(function() {
                    return window.getStats();
                })
                .then((stats) => {
                    this.finish(stats)
                });
            }
        })
        .catch(function(err) {
            log("error", err);
        })
    }

    finish(stats) {
        let exitDelay = 0;
        this.complete = true;
        console.log("\n");
        console.log("Tests finished");
        console.log(table(
            [
                ["Passed", stats.passed],
                ["Failed", stats.failed],
                ["Skipped", stats.skipped]
            ],
            {
                columns: {
                    0: {
                        width: 9
                    },
                    1: {
                        width: 6,
                        alignment: "right"
                    }
                }
            }
        ));
        if (this.config.closeDriverOnFinish) {
            this.driver.quit();
            exitDelay = 500;
        }
        if (this.config.exitOnFinish) {
            if (stats.failed > 0) {
                setTimeout(function() {
                    process.exit(1);
                }, exitDelay);
            }
        } else {
            this._completionCallbacks.forEach(function(cb) {
                (cb)();
            });
        }
    }

    initialise(url) {
        this.driver.get(url);
    }

    waitForCompletion() {
        return (this.complete) ?
            Promise.resolve() :
            new Promise((resolve) => {
                this._completionCallbacks.push(resolve);
            });
    }

    watchLogs() {
        this.logWatch = setInterval(() => {
            this.driver.executeScript(function() {
                return window.fetchLogs ? window.fetchLogs() : [];
            })
            .then(function(logs) {
                logs.forEach(function(logData) {
                    if (logData.type === "error") {
                        if (logData.args.length === 1 && isError(logData.args[0])) {
                            let containedError = logData.args[0],
                                stack = containedError.stack || formatStack(logData.stack);
                            log(logData.type, [containedError.message, stack]);
                        } else {
                            log(logData.type, logData.args);
                        }
                    } else {
                        log(logData.type, logData.args);
                    }
                })
            })
            .then(() => {
                return this.checkStatus();
            })
            .catch(function(err) {
                log("error", err);
            })
        }, 500);
    }

}

module.exports = JasDriver;
