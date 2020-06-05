# NemaNode


## Required software
- [Node.js](https://nodejs.org/en/) >= 11.15.0
- [MySQL](https://www.mysql.com/downloads/) >= 5.6
- [GCC/g++ compiler](https://packages.ubuntu.com/focal/build-essential)


## Development setup

1. Setup MySQL if first-time use: `sudo mysql_secure_installation`
2. Install app dependencies by running `npm install`
3. Setup MySQL user and database: `scripts/setup_config.sh nemanode nemanode_user password | sudo mysql`
4. Populate database: `npm run populate-database`


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


## Commands
Once setup is completed, you will be able to run the following commands in this project directory:

- `npm run watch` : start a app server to test alongside development
- `npm run build-prod` : build the production version of the app
- `npm run start` : start the production server
- `npm run test`: run the tests
- `populate-database`: take the raw data in src/server/db/raw-data and populate the mysql db with it

## Documentation
For more information on how to do various things read the documentation
- [Understanding the data used in nemanode](https://bitbucket.org/witvliet/nemanode/src/development/docs/understanding-nemanode-data.md)
- [Adding new data to nemanode](https://bitbucket.org/witvliet/nemanode/src/development/docs/adding-new-data.md)
