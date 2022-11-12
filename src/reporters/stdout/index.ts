import type { Reporter } from "../../types";

export const stdout: Reporter = async (results) => console.log(results);
