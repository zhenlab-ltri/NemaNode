# Nemanode

## Required software
- [Node.js](https://nodejs.org/en/) >=8.11.2
- [MySQL](https://www.mysql.com/downloads/) 5.6
- [GCC/g++ compiler](https://packages.ubuntu.com/focal/build-essential)

## Setup

1. Install Node.js >=8.11.2
2. Install Mysql 5.6
3. Install app dependencies by running `npm install`
4. Setup MySQL: `sudo mysql_secure_installation`
5. Setup MySQL user and database: `scripts/setup_database.sh nemanode nemanode_user password | sudo mysql`
6. Setup MySQL test database: `scripts/setup_database.sh test nemanode_user password | sudo mysql`
7. Populate dev database: `npm run populate-database`
8. Populate test database: `npm run populate-test-database`

## Commands
Once setup is completed, you will be able to run the following commands in this project directory:

- `npm run watch` : start a app server to test alongside development
- `npm run build` : build the app
- `npm run build-prod` : build the production version of the app
- `npm run start` : start the production server
- `npm run test`: run the tests
- `npm run lint`: check for code convention violations
- `npm run format-code`: format all code in the source folder to conform to code style standards
- `populate-database`: take the raw data in src/server/db/raw-data and populate the mysql db with it
- `populate-test-database`: take the raw data in src/server/db/raw-data and populate the test version of the db with it

## Documentation
For more information on how to do various things read the documentation
- [General tips](https://bitbucket.org/witvliet/nemanode/src/development/docs/general-tips.md)
- [Understanding the data used in nemanode](https://bitbucket.org/witvliet/nemanode/src/development/docs/understanding-nemanode-data.md)
- [Adding new data to nemanode](https://bitbucket.org/witvliet/nemanode/src/development/docs/adding-new-data.md)
- [Deploying nemanode](https://bitbucket.org/witvliet/nemanode/src/development/docs/deploying-to-production.md)
