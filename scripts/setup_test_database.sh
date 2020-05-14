#!/bin/sh

if [ $# -ne 3 ]
then
    echo "Usage: $0 <DATABASE-NAME> <DATABASE-USER> <DATABASE-PASWORD>"
    exit 1
fi

NEMANODE_DATABASE="$1"
NEMANODE_USER="$2"
NEMANODE_PASSWORD="$(echo $3 | sed -e "s/\\\\/\\\\\\\/g" -e "s/'/\\\'/g")"

# Create config file.
cat >test_database_config.ini <<EOL
[mysql]
database = $NEMANODE_DATABASE
user = $NEMANODE_USER
password = $NEMANODE_PASSWORD
insecureAuth = true
EOL

# Create output for MySQL.
cat <<EOSQL

DROP DATABASE IF EXISTS $NEMANODE_DATABASE;
CREATE DATABASE $NEMANODE_DATABASE;
USE $NEMANODE_DATABASE;
GRANT ALL PRIVILEGES ON *.* TO '$NEMANODE_USER'@'localhost' IDENTIFIED BY '$NEMANODE_PASSWORD';

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS datasets;
CREATE TABLE datasets (
  id VARCHAR(20) NOT NULL,
  collection VARCHAR(20) NOT NULL,
  name VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  time SMALLINT NOT NULL,
  visual_time SMALLINT NOT NULL,
  CONSTRAINT pk_datasets PRIMARY KEY (id),
  INDEX idx_datasets_id (id),
  INDEX idx_datasets_collection (collection)
);

DROP TABLE IF EXISTS datasets_json;
CREATE TABLE datasets_json (
  dataset_id VARCHAR(20) NOT NULL,
  dataset_json MEDIUMTEXT NOT NULL,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

DROP TABLE IF EXISTS neurons;
CREATE TABLE neurons (
  name VARCHAR(30) NOT NULL,
  class VARCHAR(30) NOT NULL,
  neurotransmitter VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL,
  embryonic BOOLEAN NOT NULL,
  inhead BOOLEAN NOT NULL,
  intail BOOLEAN NOT NULL,
  CONSTRAINT pk_neurons PRIMARY KEY (name)
);

DROP TABLE IF EXISTS trajectories;
CREATE TABLE trajectories (
  id INT NOT NULL,
  dataset_id VARCHAR(20) NOT NULL,
  neuron_name VARCHAR(30) NOT NULL,
  trajectory_json MEDIUMTEXT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (dataset_id) REFERENCES datasets(id),
  FOREIGN KEY (neuron_name) REFERENCES neurons(name)
);

DROP TABLE IF EXISTS trajectory_synapses;
CREATE TABLE trajectory_synapses (
  id INT NOT NULL,
  dataset_id VARCHAR(20) NOT NULL,
  post_node_id INT NOT NULL,
  pre_node_id INT NOT NULL,
  type VARCHAR(20) NOT NULL,
  PRIMARY KEY (id, dataset_id, pre_node_id, post_node_id),
  FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

DROP TABLE IF EXISTS trajectory_node_data;
CREATE TABLE trajectory_node_data (
  pre_tid INT NOT NULL,
  post_tid INT NOT NULL,
  connection_type VARCHAR(20) NOT NULL,
  pre VARCHAR(30) NOT NULL,
  post VARCHAR(30) NOT NULL
);

DROP TABLE IF EXISTS connections;
CREATE TABLE connections (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pre VARCHAR(30) NOT NULL,
  post VARCHAR(30) NOT NULL,
  type VARCHAR(20) NOT NULL,
  CONSTRAINT pk_connections PRIMARY KEY (pre, post, type),
  INDEX idx_connections_id (id),
  INDEX idx_connections_pre (pre),
  INDEX idx_connections_post (post),
  INDEX idx_connections_type (type)
);

DROP TABLE IF EXISTS synapses;
CREATE TABLE synapses (
  dataset_id VARCHAR(20) NOT NULL,
  connection_id INT UNSIGNED NOT NULL,
  synapses SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT pk_synapses PRIMARY KEY (connection_id, dataset_id),
  CONSTRAINT idx_synapses_dataset_id FOREIGN KEY (dataset_id) REFERENCES datasets(id),
  CONSTRAINT idx_synapses_connection_id FOREIGN KEY (connection_id) REFERENCES connections(id),
  INDEX idx_synapses_synapses (synapses)
);

DROP TABLE IF EXISTS annotations;
CREATE TABLE annotations (
  annotation VARCHAR(30) NOT NULL,
  connection_id INT UNSIGNED NOT NULL,
  collection VARCHAR(20) NOT NULL,
  CONSTRAINT pk_annotations PRIMARY KEY (connection_id, collection, annotation),
  CONSTRAINT idx_annotations_connection_id FOREIGN KEY (connection_id) REFERENCES connections(id),
  INDEX idx_annotations_annotation (annotation),
  INDEX idx_annotations_collection (collection)
);

SET FOREIGN_KEY_CHECKS = 1;
EOSQL
