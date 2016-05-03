"use strict";

const junitBuilder = require("junit-report-builder");
const log = require("./log.js");
const table = require("table").default;

function formatStack(stackText) {
    return stackText.replace(/^[^\n]*?Error[^\n]*/, "");
}

function isError(obj) {
    return obj && obj.message && obj.name.toLowerCase().indexOf("error") >= 0;
}

function writeJunit(suites, filename) {
    function prepareSuite(suiteData, parentSuite) {
        // @todo: re-enable when using a better junit writer that supports nesting:
        //let suite = parentSuite ? parentSuite.testSuite() : junitBuilder.testSuite();
        let suite = junitBuilder.testSuite();
        suite.name(suiteData.description);
        suiteData.specs.forEach(function(specData) {
            let testCase = suite.testCase().name(specData.description);
            if (specData.result === "passed") {
                // do nothing
            } else if (specData.result === "pending") {
                testCase.skipped();
            } else {
                testCase.failure();
            }
        });
        suiteData.suites.forEach(function(suiteDataChild) {
            prepareSuite(suiteDataChild, suite);
        });
    }
    suites.forEach(prepareSuite);
    junitBuilder.writeTo(filename);
}

class JasDriver {

    constructor(webdriverInstance, config, options) {
        this.driver = webdriverInstance;
        this.config = config;
        this.options = options;
        this.complete = false;
        this._completionCallbacks = [];
    }

    checkStatus() {
        this.driver.executeScript(function() {
            return window.testCompleted;
        })
        .then((completed) => {
            if (completed && !this.complete) {
                return this.driver.executeScript(function() {
                    return window.getStats();
                })
                .then((stats) => {
                    this.finish(stats)
                });
            }
        })
        .catch(function(err) {
            log("error", err.message);
        })
    }

    fetchLogs() {
        return this.driver.executeScript(function() {
            return window.fetchLogs ? window.fetchLogs() : [];
        })
        .then(function(logs) {
            logs.forEach(function(logData) {
                if (logData.type === "error") {
                    log(logData.type, logData.args);
                } else {
                    log(logData.type, logData.args);
                }
            })
        })
        .catch(function(err) {
            log("fatal", err);
        });
    }

    fetchReport() {
        return this.driver.executeScript(function() {
            return window.getReport ? window.getReport() : [];
        })
        .catch(function(err) {
            log("fatal", err);
        });
    }

    finish(stats) {
        clearInterval(this.logWatch);
        if (this.complete) {
            return;
        }
        this.complete = true;
        this.fetchLogs()
            .then(() => this.fetchReport())
            .then((suites) => {
                let exitDelay = 0,
                    canExit = ((!this.options.singleConfig && this.options.isLast) || this.options.singleConfig);
                log("info", "Testing completed");
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

                if (this.config.junitOutput) {
                    writeJunit(suites, this.config.junitOutput);
                    log("info", "JUnit output written to: " + this.config.junitOutput);
                }

                // Close webdriver on finish
                if (this.config.closeDriverOnFinish) {
                    this.driver.quit();
                    exitDelay = 500;
                }

                // Check if any tests failed
                if (stats.failed > 0) {
                    // exit
                    setTimeout(function() {
                        process.exit(1);
                    }, exitDelay);
                } else {
                    // Check if we can exit now that we're finished
                    if (this.config.exitOnFinish && canExit) {
                        setTimeout(function() {
                            process.exit(0);
                        }, exitDelay);
                    } else {
                        // Run other callbacks
                        this._completionCallbacks.forEach(function(cb) {
                            (cb)();
                        });
                    }
                }
            })
            .catch(function(err) {
                log("fatal", err);
            });
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
            this.fetchLogs().then(() => {
                return this.checkStatus();
            })
            .catch(function(err) {
                log("fatal", err);
            });
        }, 250);
    }

}

module.exports = JasDriver;
