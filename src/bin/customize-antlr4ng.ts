import fs from 'fs';
import path, { join as pathJoin } from 'path';

function replaceInFiles(folderPath: string, searchString: string, replacement: string): void {
    // Get a list of all files in the folder
    const files = fs.readdirSync(folderPath);

    // Iterate over each file
    files.forEach(file => {
        const filePath = path.join(folderPath, file);

        // Check if the path is a directory or a file
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            // If it's a directory, recursively call the function
            replaceInFiles(filePath, searchString, replacement);
        } else if (stats.isFile() && filePath.endsWith(".ts")) {

            // If it's a file, read its contents
            let contents = fs.readFileSync(filePath, 'utf8');

            // Replace all occurrences of the search string with the replacement string
            contents = contents.replace(new RegExp(searchString, 'g'), replacement);

            // Write the modified contents back to the file
            fs.writeFileSync(filePath, contents, { encoding:'utf8', flag:'w' });
        }
    });
}

const folderPath = pathJoin(__dirname, "..", "lib", "generated");
const searchString = '"antlr4ng"';
const replacement = '"@making-sense/antlr4ng"';

replaceInFiles(folderPath, searchString, replacement);
