import { Octokit } from "@octokit/rest";
import { IS_DEMO } from "../../core/utils";

export default async function ({ token, projectName }: { token: string, projectName: string }) {

  if (IS_DEMO()) {
    return await new Promise(resolve => setTimeout(resolve, 5000, {}));
  }
  else {
    const octokit = new Octokit({
      auth: token,
    });
    const { data } = await octokit.repos.createUsingTemplate({
      name: projectName,
      template_repo: "vanilla-api",
      template_owner: "staticwebdev",
      include_all_branches: false,
      private: true
    });
    return data;
  }
};
