import fs from 'fs';

const folderPath = './tests/data/trainingsets';
const filePaths = fs.readdirSync(folderPath);

for (let i = filePaths.length - 1; i >= 0; i--) {
  if (filePaths[i].split('.').pop() !== 'json') {
    filePaths.splice(i, 1);
  } else {
    filePaths[i] = `${folderPath}/${filePaths[i]}`;
  }
}

export default filePaths;