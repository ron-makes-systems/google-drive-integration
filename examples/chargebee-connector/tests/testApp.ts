import {createApp} from "../src/app.js";

export const createTestApp = () => {
  const app = createApp();
  const server = app.listen();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 3500;
  const url = `http://127.0.0.1:${port}`;

  return {
    async destroy() {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
    url,
  };
};
