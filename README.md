## How it works
@intus/raspberry-server is a FeathersJS WebSocket server, and @intus/raspberry-frontend is a React application, that will be served and communicate with the server.

The build process first builds the server to a build folder, then the frontend, which will copy the built files to the public folder of the server package folder. Then, using vercel/pkg package, the server will be packaged to a binary, which then can run inside a raspberry.

When building for staging and production, must be sure that all the values inside the config folder are correct, because they'll be used by the packaged application.

## Running the app on Raspberry
When production:
`NODE_ENV=production DISPLAY_ID=1 DISPLAY_API_TOKEN="1|nBFdATiw1jQQuKpeXQ48uwyaant4dt6nxmjEAdK9" ./raspberry-server-arm64`
When staging:
`NODE_ENV=staging DISPLAY_ID=1 DISPLAY_API_TOKEN="1|nBFdATiw1jQQuKpeXQ48uwyaant4dt6nxmjEAdK9" ./raspberry-server-arm64`
When development:
`NODE_ENV=development DISPLAY_ID=1 DISPLAY_API_TOKEN="1|nBFdATiw1jQQuKpeXQ48uwyaant4dt6nxmjEAdK9" ./raspberry-server-arm64`

