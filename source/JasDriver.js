"use strict";

const log = require("./log.js");
const table = require("table").default;

class JasDriver {

    constructor(webdriverInstance, config) {
        this.driver = webdriverInstance;
        this.config = config;
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
        if (stats.failed > 0 && this.config.exitOnFinish) {
            setTimeout(function() {
                process.exit(1);
            }, exitDelay);
        }
    }

    initialise(url) {
        this.driver.get(url);
    }

    watchLogs() {
        this.logWatch = setInterval(() => {
            this.driver.executeScript(function() {
                return window.fetchLogs ? window.fetchLogs() : [];
            })
            .then(function(logs) {
                logs.forEach(function(logData) {
                    //renderLog(log.type, log.args);
                    log(logData.type, logData.args);
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
