# Clubito Server
## Usage
1. Clone repo
2. `npm install` inside the repo folder
3. `npm run watch-debug`. This will build and run the server while watching any file changes you make. Use while developing.
4. `npm run build`. This will build the server and place the Javascript output in the `dist` folder. Only really used for production deployment.
5. `npm run serve`. This will run the compiled server in `dist/server.js`. 

## Models
All database models go into the `model` folder (obviously). The `Interfaces` folder contain all the interfaces used in both the database models *and* throughout the code. 

## Deployment
Any code that's pushed to the `main` branch is automatically built and deployed to `https://server.clubito.me`. 

## Logging
Pino is used as the logging library. In development, every request is logged and outputted to the console, but is silenced in production.
Import the `logger` object like this: `import logger from  "@logger";` at the top of every file. Then, use the appropriate logging level: `debug -> info -> warn -> error, fatal`. 

## Path Resolutions
I set up the compiler to resolve three paths to make life easier. 

`@logger` resolves to `src/util/logger`
`@models/*` resolves to `src/models/*`
`@secrets` resolves to `src/util/secrets`

This is to prevent the whole `../../../` nonsense from different file levels. Please use this lol.

