# gitlab-compressed-size-action

> A GitLab CI job that will post file-size changes on your pull-requests as comments

[![Node CI](https://github.com/craft-interactive/gitlab-compressed-size-action/workflows/CI/badge.svg)](https://github.com/craft-interactive/gitlab-compressed-size-action/actions)
[![codecov](https://codecov.io/gh/craft-interactive/gitlab-compressed-size-action/branch/master/graph/badge.svg)](https://codecov.io/gh/craft-interactive/gitlab-compressed-size-action)
[![npm](https://img.shields.io/npm/dm/gitlab-compressed-size-action.svg)](https://www.npmjs.com/package/gitlab-compressed-size-action)

This package was created to provide the same DX as the popular [GitHub compressed-size-action](https://github.com/marketplace/actions/compressed-size-action) when using GitLab.

It's built on top of basic GitLab APIs and requires you to only provide a valid Access token with the scope `api` being set.

## Installation

```sh
npm i -D gitlab-compressed-size-action
```

## Usage

First of all, create a GitLab Access token with the scope `api`, for demonstration purposes you can create one with your user account, in the long run it would make more sense to create a separate user account for this action.

In the project where you would like to integrate the action, simply add the token as a CI Environment variable in the project settings.

Once this is done, simply integrate the action in your `.gitlab-ci.yml`, e.g.

```yaml
include:
  - remote: https://raw.githubusercontent.com/craft-interactive/gitlab-compressed-size-action/v1.0.0/.gitlab-ci.template.yml

report-file-size-changes:
  extends:
    - .report-file-size-changes
  # Adjust the `stage` and `needs` to your own requirements
  stage: build
  needs: [install_dependencies, build]
  variables:
    FILE_SIZE_CHANGE_PATTERN: "build/*"
    # IMPORTANT: Replace `MY_ACCESS_TOKEN_VARIABLE` with the name of your CI environment variable!
    FILE_SIZE_CHANGE_TOKEN: $MY_ACCESS_TOKEN_VARIABLE
    FILE_SIZE_CHANGE_OPTIONS: "--threshold 20mb"
```

## Options

##### `--auth <token>`

The GitLab Access Token used to communicate with the API of your GitLab instance. If you use the `gitlab-ci.template.yml` as recommended above, you can specify the token as an environment variable, e.g. `FILE_SIZE_CHANGE_TOKEN`.

##### `--out-file <file-path>`

The file-path where the size report will be written to. If you use the `gitlab-ci.template.yml` as recommended above, this option can be safely ignored :-)

##### `--reporters [reporter-ids...]`

Optional list of reporters to execute after computing the results. Available reporters are ...

- `gitlab-pr-note` (default)
- `stdout`

##### `--threshold [bytes]`

An optional threshold which each file should respect, if reached the script will fail.

##### `--threshold-overall [bytes]`

An optional threshold for the sum of all files, if reached the script will fail.

##### `--silent`

In case you want to silence the log output, simply provide this option.

## License

MIT
