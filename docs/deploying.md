
# Deploying nemanode (Zhen lab specific)

What you need:
1. ssh access to the <LINUX_SERVER>


## Updating the client

1. checkout <GIT VERSION/COMMIT> that you want to deploy on your local computer
2. build the app client by running `npm run build-prod`
3. upload the built app files to the server by running  `rsync -av dist <USER>@<LINUX_SERVER_IP>:<PATH_TO_SERVER_DIR>` note: remember not to add a trailing slash to the `dist` arg

## Updating the server

Note: ensure that the server are using has the correct version of node by typing `node --version` (see README for specified node version)

4. ssh to <LINUX_SERVER>
5. cd to <PATH_TO_SERVER_DIR>
6. run `git checkout <GIT VERSION/COMMIT>`
7. configure secrets, port, username, password credentials if any in src/config.js
8. `rm -rf node_modules` if there are dependency changes
9. install dependencies `npm i` if there are dependency changes

## Updating the database

10. run `npm run populate-database` if the raw data has changed

## Restarting the server

11. delete the old instance of the server using pm2: `pm2 delete <APP_ID>`
12. restart the server with the new changes: `pm2 start src/server/index.js --cron "*/15 * * * *`
