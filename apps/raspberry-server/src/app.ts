import path from "path";

process.env["NODE_CONFIG_DIR"] = path.join(__dirname, "../", "config/");

import configuration from "@feathersjs/configuration";
import express from "@feathersjs/express";
import feathers from "@feathersjs/feathers";
import { HookContext as FeathersHookContext } from "@feathersjs/feathers";
import socketio from "@feathersjs/socketio";
import compress from "compression";
import cors from "cors";
import helmet from "helmet";
import os from "os";

import appHooks from "./app.hooks";
import channels from "./channels";
import { IntusAPI } from "./clients/intusAPI/intusAPI";
import { Application } from "./declarations";
import logger from "./logger";
import middleware from "./middleware";
import services from "./services";
// Don't remove this comment. It's needed to format import lines nicely.

const app: Application = express(feathers());
export type HookContext<T = any> = {
  app: Application;
} & FeathersHookContext<T>;

// Load app configuration
app.configure(configuration());

IntusAPI.apiUrl = app.get("apiUrl");
if (process.env.NODE_ENV === "development") {
  const storagePath = process.cwd();
  console.log("STORAGE PATH: ", storagePath);
  app.set("nedb", `${storagePath}/data`);
  app.set("medias", `${storagePath}/medias`);
} else {
  const userHomeDir = os.homedir();
  const storagePath = path.join(userHomeDir, ".local/", "share/", "intus/");
  app.set("nedb", `${storagePath}/data`);
  app.set("medias", `${storagePath}/medias`);
}

// Enable security, CORS, compression, favicon and body parsing
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(app.get("public")));
app.use("/medias", express.static(path.join(app.get("medias"))));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

// Configure other middleware (see `middleware/index.ts`)
app.configure(middleware);
// Set up our services (see `services/index.ts`)
app.configure(services);
// Set up event channels (see channels.ts)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger } as any));

app.hooks(appHooks);

export default app;
