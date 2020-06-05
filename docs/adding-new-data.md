# Adding new data

## Add new datasets
1. name the connection dataset file according to the following file name convention:

`<datasetId>.json`

- where datasetId is the id of the new dataset you want to add

2. place the file in the src/server/populate-db/raw-data/connections/ folder

3. modify src/server/populate-db/raw-data/datasets.json to include the new dataset.  Ensure the new dataset is consistent with all the other data in datasets.json.

4. run ```npm run populate-database```

### Add new annotations
1. name the annotation dataset file accroding to the following file name convention:

`<datasetType>.annotations.json`

- where datasetType is the type of dataset the annotations apply to (one of 'head', 'tail', or 'complete')

2. place the file in src/server/populate-db/raw-data/annotations/ folder

3. run ```npm run populate-database```