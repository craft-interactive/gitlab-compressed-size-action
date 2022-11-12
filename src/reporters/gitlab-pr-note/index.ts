import type { Reporter } from "../../types";

export const gitlabPullRequestNote: Reporter = async (results, services) => {
  const { env, gitlab } = services;
  const prefix = `### :package: file-size-change report`;
  const comments = await gitlab.getPullRequestComments({
    mergeRequestIid: env.CI_MERGE_REQUEST_IID,
  });
  const comment = comments.find((comment) => comment.body.startsWith(prefix));
  const details = `${prefix}

| Path | Size | Change  |        |
| ---- | ---- | ------- | ------ |
${results
  .map(({ id, size, change, isBelowThreshold }) => {
    let path = id;
    let emoji = ":white_check_mark:";

    if (id === "summary") {
      path = "**summary**";
      emoji = isBelowThreshold ? ":white_check_mark:" : ":boom:";
    } else {
      const isUnchanged = change.raw === 0;

      if (isBelowThreshold) {
        if (isUnchanged) {
          emoji = ":small_blue_diamond:";
        } else {
          emoji = ":white_check_mark:";
        }
      } else {
        emoji = ":boom:";
      }
    }

    return `| ${path} | ${size.pretty} | ${change.pretty} (${change.percent}%) | ${emoji} |`;
  })
  .join("\n")}
`;

  if (comment) {
    await gitlab.modifyPullRequestComment({
      mergeRequestIid: env.CI_MERGE_REQUEST_IID,
      commentId: comment.id,
      comment: details,
    });
  } else {
    await gitlab.createPullRequestComment({
      mergeRequestIid: env.CI_MERGE_REQUEST_IID,
      comment: details,
    });
  }
};
