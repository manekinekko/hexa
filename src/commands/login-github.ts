
import { OAuthApp, createNodeMiddleware } from "@octokit/oauth-app";
import type { Server, ServerResponse, IncomingMessage } from 'http';
import { createServer } from 'http';
import internalIp from 'internal-ip';

const PORT = 8081;
const HOST = internalIp.v4.sync();
const OAUTH_CALLBACK_URL = `http://${HOST}:${PORT}/api/github/oauth/login`;

const OAuthConfig = {
  clientType: "oauth-app",
  clientId: "9a07ae2fba267820e3ee",
  clientSecret: "4d17a77be7e285d050bda7ca285e16a7b7806eab",
  defaultScopes: ['repo', 'workflow']
};
const app = new OAuthApp(OAuthConfig as any);

const requestListener = (resolve: Function) => async (request: IncomingMessage, response: ServerResponse) => {
  const url = new URL(request?.url!, `http://${HOST}:${PORT}`);
  if (url.pathname === "/api/github/oauth/callback/firestorm") {

    const code = String(url.searchParams.get("code"));
    const state = String(url.searchParams.get("state"));

    const { authentication } = await app.createToken({
      state,
      code,
    });
    console.log(`Token:​`);
    console.log(JSON.stringify(authentication));
    resolve(authentication.token);

    response.writeHead(200, '', {
      'Content-Type': 'text/html'
    });
    response.end("<script>window.close();</script>You can close your browser.");

    serverInstance?.close();
    serverInstance = null;
  }
  else {
    createNodeMiddleware(app)(request, response);
  }

}

// server singleton
let serverInstance: Server | null = null;
const getServerInstance = (resolve: Function) => {
  if (serverInstance === null) {
    serverInstance = createServer(requestListener(resolve))
  }
  return serverInstance;
};

export async function loginWithGitHub(callback: Function): Promise<string | null> {
  return new Promise((resolve: Function, reject: Function) => {
    const server = getServerInstance(resolve);

    if (server.listening) {
      callback(OAUTH_CALLBACK_URL);
      Promise.resolve(null);
    }
    else {
      server.listen(PORT, HOST).on("listening", () => {
        console.log(`GitHub Auth server listening on port http://${HOST}:${PORT}`);
        console.log(`→ To login: ${OAUTH_CALLBACK_URL}`);
        callback(OAUTH_CALLBACK_URL);
      }).on("error", (err: any) => {
        reject(err);
      });
    }

  });
}
