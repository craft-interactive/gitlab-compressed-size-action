import { reporters } from "./reporters";
import type { Diff, Env, GitLabAPI, Logger } from "./services";

type Services = { gitlab: GitLabAPI; env: Env; logger: Logger };
type Reporter = (results: Diff[], services: Services) => Promise<void>;
type ReporterId = keyof typeof reporters;

export { Diff, Reporter, ReporterId, Services };
