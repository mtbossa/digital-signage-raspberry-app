import "@feathersjs/transport-commons";

import { HookContext } from "@feathersjs/feathers";

import { ClientRequestError } from "./clients/intusAPI/intusAPI";
import { Application } from "./declarations";
import { Post } from "./models/posts.model";

export default function (app: Application): void {
  if (typeof app.channel !== "function") {
    // If no real-time functionality has been configured just return
    return;
  }

  const postsService = app.service("posts");
  const postsSyncService = app.service("posts-sync");
  const serverStatusCheckerService = app.service("server-status-checker");
  const channelsConnectorService = app.service("backend-channels-connector");
  const showcaseChecker = app.service("showcase-checker");

  app.on("connection", async (connection: any): Promise<void> => {
    // On a new real-time connection, add it to the anonymous channel
    console.log("[ FRONTEND CONNECTED ]");

    app.channel("anonymous").join(connection);

    // When initializing the system, checks connection so when frontend connects
    // we already know if we have internet connection or not
    try {
      // Sets all posts to showing false, since when system is starting up, no post is showing.
      const currentPosts = (await postsService.find({ paginate: false })) as Post[];
      await Promise.allSettled(
        currentPosts.map((post) =>
          postsService.update(post._id, { ...post, showing: false })
        )
      );
      await postsSyncService.create({ synced: false });
      await channelsConnectorService.create({ channelsConnected: false });
    } catch (e) {
      if (e instanceof Error) {
        console.error("Error while initial syncing: ", e.message);
      }
      if (e instanceof ClientRequestError) {
        console.log("[ SERVER DOWN WHILE SYNCING ]");

        await serverStatusCheckerService.patch(null, {
          ...serverStatusCheckerService.status,
          server: "down",
        });
      }
    }
    showcaseChecker.create({});
    serverStatusCheckerService.start();
  });

  app.on("login", (authResult: any, { connection }: any): void => {
    // connection can be undefined if there is no
    // real-time connection, e.g. when logging in via REST
    if (connection) {
      // Obtain the logged in user from the connection
      // const user = connection.user;

      // The connection is no longer anonymous, remove it
      app.channel("anonymous").leave(connection);

      // Add it to the authenticated user channel
      app.channel("authenticated").join(connection);

      // Channels can be named anything and joined on any condition

      // E.g. to send real-time events only to admins use
      // if(user.isAdmin) { app.channel('admins').join(connection); }

      // If the user has joined e.g. chat rooms
      // if(Array.isArray(user.rooms)) user.rooms.forEach(room => app.channel(`rooms/${room.id}`).join(connection));

      // Easily organize users by email and userid for things like messaging
      // app.channel(`emails/${user.email}`).join(connection);
      // app.channel(`userIds/${user.id}`).join(connection);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.publish((data: any, hook: HookContext) => {
    // Here you can add event publishers to channels set up in `channels.ts`
    // To publish only for a specific event use `app.publish(eventname, () => {})`

    // e.g. to publish all service events to all authenticated users use
    return app.channel("authenticated");
  });

  // Here you can also add service specific event publishers
  // e.g. the publish the `users` service `created` event to the `admins` channel
  // app.service('users').publish('created', () => app.channel('admins'));
  app.service("posts").publish("sync-finish", () => app.channel("anonymous"));
  app.service("posts").publish("start-post", () => app.channel("anonymous"));
  app.service("posts").publish("end-post", () => app.channel("anonymous"));

  // With the userid and email organization from above you can easily select involved users
  // app.service('messages').publish(() => {
  //   return [
  //     app.channel(`userIds/${data.createdBy}`),
  //     app.channel(`emails/${data.recipientEmail}`)
  //   ];
  // });
}
