// TODO: Generate based on the OpenAPI spec of GitLab.

export type Pipeline = {
  id: number;
  iid: number;
  project_id: number;
  sha: string;
  ref: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  web_url: string;
  before_sha: string;
  tag: boolean;
  yaml_errors: any;
  user: {
    id: number;
    username: string;
    name: string;
    state: string;
    avatar_url: string;
    web_url: string;
  };
  started_at: string;
  finished_at: string;
  committed_at: any;
  duration: number;
  queued_duration: any;
  coverage: any;
  detailed_status: {
    icon: string;
    text: string;
    label: string;
    group: string;
    tooltip: string;
    has_details: false;
    details_path: string;
    illustration: any;
    favicon: string;
  };
};

export type PipelineJob = {
  id: number;
  status: string;
  stage: string;
  name: string;
  ref: string;
  tag: boolean;
  coverage: any;
  allow_failure: false;
  created_at: string;
  started_at: string;
  finished_at: string;
  duration: number;
  queued_duration: number;
  user: {
    id: number;
    username: string;
    name: string;
    state: string;
    avatar_url: string;
    web_url: string;
    created_at: string;
    bio: string;
    location: string;
    public_email: string;
    skype: string;
    linkedin: string;
    twitter: string;
    website_url: string;
    organization: string;
    job_title: string;
    pronouns: string;
    bot: false;
    work_information: null;
    followers: number;
    following: number;
    local_time: string;
  };
  commit: {
    id: string;
    short_id: string;
    created_at: string;
    parent_ids: string[];
    title: string;
    message: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committer_name: string;
    committer_email: string;
    committed_date: string;
    trailers: {};
    web_url: string;
  };
  pipeline: {
    id: number;
    iid: number;
    project_id: number;
    sha: string;
    ref: string;
    status: string;
    source: string;
    created_at: string;
    updated_at: string;
    web_url: string;
  };
  web_url: string;
  project: { ci_job_token_scope_enabled: boolean };
  artifacts_file: { filename: string; size: number };
  artifacts: [
    {
      file_type: string;
      size: number;
      filename: string;
      file_format: string;
    },
    {
      file_type: string;
      size: number;
      filename: string;
      file_format: string;
    },
    {
      file_type: string;
      size: number;
      filename: string;
      file_format: string;
    }
  ];
  runner: {
    id: number;
    description: string;
    ip_address: string;
    active: boolean;
    paused: boolean;
    is_shared: boolean;
    runner_type: string;
    name: string;
    online: boolean;
    status: string;
  };
  artifacts_expire_at: string;
  tag_list: string[];
};

export type MergeRequestNote = {
  id: number;
  type: any;
  body: string;
  attachment: any;
  author: {
    id: number;
    username: string;
    name: string;
    state: string;
    avatar_url: string;
    web_url: string;
  };
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
  resolvable: boolean;
  confidential: boolean;
  internal: boolean;
  noteable_iid: number;
  commands_changes: any;
};
