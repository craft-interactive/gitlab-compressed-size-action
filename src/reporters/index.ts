import { gitlabPullRequestNote } from "./gitlab-pr-note";
import { stdout } from "./stdout";

export const reporters = {
  stdout,
  "gitlab-pr-note": gitlabPullRequestNote,
};
