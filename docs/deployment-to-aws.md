# Create and update an AWS Lightsail instance

## Deploying NemaNode to AWS Lightsail
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
11. Add SSL certificate `sudo /opt/bitnami/bncert-tool`
12. Add to bitnami configuration file `/opt/bitnami/apache2/conf/bitnami/bitnami.conf` after `<VirtualHost _default_:443>`:
    
        DocumentRoot "/home/bitnami/NemaNode/dist"
        <Directory "/home/bitnami/NemaNode/dist">
            Require all granted
        </Directory>
        ProxyPass / http://localhost:3000/
        ProxyPassReverse / http://localhost:3000/

13. Restart apache with `sudo /opt/bitnami/ctlscript.sh restart apache`


## Updating AWS Lightsail instance

1. ssh to <LINUX_SERVER>
2. `cd NemaNode`
3. `git pull`
4. If there are dependency changes: `rm -rf node_modules; npm install`
5. If there are database changes: `npm run populate-database`
6. `npm run build-prod`
7. Restart backend: `forever restart ./src/server/index.js`

