# How it works
<p><i>@intus/raspberry-server</i> package is a FeathersJS WebSocket/HTTP server, and <i>@intus/raspberry-frontend</i> is a React application, which is served by the HTTP server, and communicats with it through the WebSocket server.</p>

### Build process:
>First the server is build to a build/ folder, then the frontend as well, which will copy the built files to the public folder of the server folder. Then, using [`vercel/pkg`](https://github.com/vercel/pkg), the server will be packaged to a binary containing the built frontend and the configuration files used by the server.

## **Atention**

When building for staging and production, must be sure that all the values inside the config folder are correct, because they'll be used by the packaged application.

After build, must push the new build package to the [intus-kiosk-app repository](https://github.com/intuskioskapp/intuskioskapp.git) with key in the correct branch. Eg.: If build for staging, push to staging branch.

Then, must clone from specif branch 

# Running the app on Raspberry
* Production: <br>
`NODE_ENV=production DISPLAY_ID=<DISPLAY_ID> DISPLAY_API_TOKEN="<DISPLAY_API_TOKEN>" ./raspberry-server`
* Staging: <br>
`NODE_ENV=staging DISPLAY_ID=<DISPLAY_ID> DISPLAY_API_TOKEN="<DISPLAY_API_TOKEN>" ./raspberry-server`
* Development: <br>
`NODE_ENV=development DISPLAY_ID=<DISPLAY_ID> DISPLAY_API_TOKEN="<DISPLAY_API_TOKEN>" ./raspberry-server`

