# General Tips
A few tips and pointers on how to work effectively on nemanode

## How to search through all files at once

Search: `grep -Rn src/js src/scss src/index.html -e 'searchForThis'`

Search and replace: `find src/js -type f -exec sed -i 's/replacethis/withThis/g' {} +`