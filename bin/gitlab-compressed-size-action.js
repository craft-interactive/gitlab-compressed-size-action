#!/usr/bin/env node

const { Command } = require("commander");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const api = require("../build/index");

(async () => {
  const pkg = JSON.stringify(
    readFileSync(join(__dirname, "../package.json"), "utf-8")
  );
  const wrap =
    (cb) =>
    async (...args) => {
      try {
        await cb(...args);
      } catch (err) {
        console.error("Command failed with an unexpected error", err);
        process.exit(1);
      }
    };

  const program = new Command();

  program.name(pkg.name);
  program.description(pkg.description);
  program.version(pkg.version);

  /**
   * @example gitlab-compressed-size-action diff build/* --auth $MY_GITLAB_TOKEN --report ./.gitlab-compressed-size-action-report.json
   */
  program
    .command("diff")
    .description(
      "Compares the file-size of the targeted files and reports changes to your PR / CI pipeline."
    )
    .argument("<file-path-pattern...>", "The file path pattern to diff")
    .requiredOption(
      "--auth <token>",
      "The GitLab Access Token used to communicate with the API of your GitLab instance."
    )
    .requiredOption(
      "--out-file <file-path>",
      "The file-path where the size report will be written to."
    )
    .option(
      "--reporters [reporter-ids...]",
      "Optional list of reporters to execute after computing the results."
    )
    .option(
      "--threshold [bytes]",
      "An optional threshold which each file should respect, if reached the script will fail."
    )
    .option(
      "--threshold-overall [bytes]",
      "An optional threshold for the sum of all files, if reached the script will fail."
    )
    .option(
      "--silent",
      "In case you want to silence the log output, simply provide this option to the command."
    )
    .action(
      wrap(async (filePatterns, options) => {
        await api.diff({
          filePatterns,
          auth: options.auth,
          outFile: options.outFile,
          reporters: options.reporters,
          silent: options.silent,
          thresholds: {
            each: options.threshold,
            overall: options.thresholdOverall,
          },
        });
      })
    );

  program.parse();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
