# Understanding nemanode data
Nemanode uses data collected by the members of Zhen Lab.

The data consists of:
- cell data
- connection data
- dataset data

## Dataset data
A dataset is associated with connections data, e.g. connections A,B, C are found in dataset D which represents a nematode specimen at a specific age.

- ```name```: name of the dataset
- ```id```: id of the dataset
- ```type```: region that the dataset captures.  one of 'head', 'tail', or 'complete'
- ```time```: the age of the specimen in hours e.g. 15
- ```visual_time```: time to represent visually for the app
- ```description```: description of the dataset
- ```axes```: anatomical origin of each axis
It represents a nematode specimen at a specific development stage.

## Neuron data
A representation of a nematode cell.
Each cell is represented with the following attributes:

- ```name```: neuron name (string) e.g. AWAL
- ```class```: neuron class (string) e.g. AWA
- ```nt```: neurotransmitter (string), where each character of the string represents a neurotransmitter type.  e.g. 'adg' means the cell has 'acetylcholine', 'dopamine', and 'GABA' neurotransmitter types.  Possible neurotransmitter types:
    - ```a```: acetylcholine
    - ```d```: dopamine
    - ```g```: GABA
    - ```l```: glutamate
    - ```o```: octopamine
    - ```s```: serotonin
    - ```t```: tyramine
    - ```u```: unknown
    - ```n```: nothing (e.g. muscles)
- ```typ```: type of the cell (string), where each character of the string represents a type.  e.g. 'sim' means the cell has the types 'sensory neuron', 'interneuron' and 'motor neuron'.  Possible types:
    - ```s```: sensory neuron
    - ```i```: interneuron
    - ```m```: motor neuron
    - ```n```: neuromodulative neuron
    - ```b```: muscle
    - ```''```: unknown
- ```emb```: whether the cell is embryonic (boolean), can be either 1 (embryonic) or 0 (post-embryonic)
- ```inhead```: whether the cell is in the head
- ```intail```: whether the cell is in the tail

## Connection data
A representation of a nematode cell connection.
Each connection is represented with the following attributes:

- ```pre```: name of pre-synaptic cell (string) e.g. AWAL
- ```post```: name of post-synaptic cell (string) e.g. RIML
- ```typ```: type of synaptic connection (int), can be either:
    ```0```: chemical synapse
    ```2```: electrical synapse (gap junction)
- ```syn```: number of synapses that connection consists of (int)
- ```ids```: each synapse has a unique ID. This data is currently not used.


## Examples

Neuron:
```json
 {
  "inhead": 1,
  "name": "ADAL",
  "emb": 1,
  "nt": "l",
  "intail": 0,
  "classes": "ADA",
  "typ": "i"
 },
```

Connection:
```json
  {
    "pre": "VB4",
    "post": "DD3",
    "typ": 0,
    "syn": [
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    ]
  }
```

Dataset:
```json
  {
    "id":"adult",
    "name":"Adult",
    "type":"complete",
    "time":60,
    "visualTime":50,
    "description":"Near-complete adult.<br /><i>White et al.</i>, compiled by Varshney et al., 2011",
    "published":true
  }
```