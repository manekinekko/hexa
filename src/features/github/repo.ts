import { Octokit } from "@octokit/rest";

export default async function ({ token, projectName }: { token: string, projectName: string }) {
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
};
