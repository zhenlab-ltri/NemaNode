
# Deploying to production/dev/test (Zhen lab specific)

What you need:
1. ssh access to the <LINUX_SERVER> (ask Daniel/Dylan)


Step 1 (on your machine):
1. checkout <GIT VERSION/COMMIT> that you want to deploy
2. build the app client by running `npm run build-prod`
3. upload the built app files to the server by running  `rsync -av dist <USER>@<LINUX_SERVER_IP>:<PATH_TO_SERVER_DIR>`

Step 2 (on the linux server):
4. ssh to <LINUX_SERVER>
5. cd to <PATH_TO_SERVER_DIR>
6. run `git checkout <GIT VERSION/COMMIT>`
7. configure secrets, port, username, password credentials if any in src/config.js
8. open a new screen by running `screen -S my-nemanode-version`
9. run `npm run start`
10. press CTRL + a + d to detach the screen
11. type `screen -r my-nemanode-version` to resume the screen session to start/stop/restart the nemanode server


### How to sync database changes to dev.nemanode.org

This needs to be optimized, but for now:

ssh: the computer that nemanode is deployed to
locally: the computer with the local db to update nemanode with
1. `mysqldump -u nemanode_user -p nemanode > db.sql` (locally)
2. `rsync -avzc db.sql witvliet@107.180.1.16:~/`
3. `mysql -u nemanode_user -D nemanode -p` (ssh)
4. `source db.sql;` (ssh)
