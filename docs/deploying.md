
# Deploying nemanode (Zhen lab specific)

What you need:
1. ssh access to the <LINUX_SERVER>
2. install (PM2)[https://pm2.keymetrics.io/docs/usage/quick-start/] on the server `npm i pm2 -g`


## Initial deployment
1. ssh to <LINUX_SERVER>
2. `sudo apt install mysql`
3. `sudo mysql_secure_installation`
4. `git clone git@github.com:dwitvliet/NemaNode.git`
5. `cd NemaNode`
6. Setup config file: `scripts/setup_config.sh nemanode nemanode_user password | sudo mysql`
7. Add google analytics to `config.ini`
8. Populate database: `npm run populate-database`
9. build the client by running `npm run build-prod`
10. Start the server with `forever start ./src/server/index.js`
11. Add apache configuration file `/opt/bitnami/apache2/conf/vhosts/nemanode-http-vhost.conf`:
    
        <VirtualHost _default_:80>
        ServerAlias *
        DocumentRoot "/home/bitnami/NemaNode/dist"
        <Directory "/home/bitnami/NemaNode/dist">
            Require all granted
        </Directory>
        ProxyPass / http://localhost:3000/
        ProxyPassReverse / http://localhost:3000/
        </VirtualHost>
    
12. Enable apache configuration file by adding `/opt/bitnami/apache2/conf/vhosts/nemanode-http-vhost.conf` to `/opt/bitnami/apache2/conf/httpd.conf`
13. Restart apache with `sudo /opt/bitnami/ctlscript.sh restart apache`


## Updating the production server

1. ssh to <LINUX_SERVER>
2. `cd NemaNode`
3. `git pull`
4. If there are dependency changes: `rm -rf node_modules; npm install`
5. If there are database changes: `npm run populate-database`
6. `npm run build-prod`
7. Restart backend: `forever restart ./src/server/index.js`



## Old Godaddy instructions (will be removed soon, hopefully)

Note: ensure that the server are using has the correct version of node by typing `node --version` (see README for specified node version)

1. ssh to <LINUX_SERVER>
2. cd to <PATH_TO_SERVER_DIR>
3. run `git checkout <GIT VERSION/COMMIT>`
4. `rm -rf node_modules` if there are dependency changes
5. install dependencies `npm i` if there are dependency changes
6. build the client by running `npm run build-prod`

## Updating the database

7. run `npm run populate-database` if the raw data has changed

## Restarting the server

8. delete the old instance of the server using pm2: `pm2 delete <APP_ID>`
9. restart the server with the new changes: `pm2 start src/server/index.js --cron "*/15 * * * *"`
