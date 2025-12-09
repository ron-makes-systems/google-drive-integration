import {createApp} from "../src/app.js";
import {Server} from "http";
import {AddressInfo} from "net";

export interface TestApp {
  url: string;
  destroy(): Promise<void>;
}

export const createTestApp = (): TestApp => {
  const app = createApp();
  const server: Server = app.listen();
  const port = (server.address() as AddressInfo).port;
  const url = `http://127.0.0.1:${port}`;

  return {
    url,
    async destroy() {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  };
};
