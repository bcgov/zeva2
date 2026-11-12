import { createServer } from "node:http";

export const startHealthServer = (isReady: () => boolean) => {
  const server = createServer((request, response) => {
    if (request.method !== "GET") {
      response.writeHead(405).end();
      return;
    }

    switch (request.url?.split("?")[0]) {
      case "/health/live":
        response.writeHead(200).end("ok");
        return;
      case "/health/ready":
        if (isReady()) {
          response.writeHead(200).end("ok");
        } else {
          response.writeHead(503).end("not ready");
        }
        return;
      default:
        response.writeHead(404).end();
    }
  });

  server.listen(8080, "0.0.0.0");
  return server;
};
