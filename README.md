# NemaNode

Interactive map of nervous system wiring in the nematode _C. elegans_. Live at [NemaNode.org]{https://nemanode.org/}.

## Required software
- [Node.js](https://nodejs.org/en/) >= 11.15.0
- [MySQL](https://www.mysql.com/downloads/) >= 5.6
- [GCC/g++ compiler](https://packages.ubuntu.com/focal/build-essential)


## Development setup

1. Setup MySQL if first-time use: `sudo mysql_secure_installation`
2. Install app dependencies by running `npm install`
3. Setup MySQL user and database: `scripts/setup_config.sh nemanode nemanode_user password | sudo mysql`
4. Populate database: `npm run populate-database`


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
- [Deployment to AWS](https://bitbucket.org/witvliet/nemanode/src/development/docs/deployment-to-aws.md)
