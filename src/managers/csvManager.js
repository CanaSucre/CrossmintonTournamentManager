// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const fs = require("fs");


// ------------------------ //
//        CONSTANTES        //
// ------------------------ //
const SEPARATOR = ";";


// ------------------------ //
//        PROGRAMME         //
// ------------------------ //

/**
 * Lit un fichier CSV et retourne son contenu dans un tableau de tableaux
 * @param {string} filePath 
 * @returns { Array<Array<string>> }
 */
const readCSVfromFile = (filePath) => {

    try {
        let data = fs.readFileSync(filePath, "utf8");

        return readCSV(data);
        
    } catch (error) {
        throw new Error(`Error reading CSV file: ${error.message}`);
    }
}

/**
 * Lit une chaîne CSV et retourne son contenu dans un tableau de tableaux
 * @param {string} content 
 * @returns Array<Array<string>>
 */
const readCSV = (content) => {
    try {
        // Séparation des lignes et mise en forme des cellules
        let rows = content.split("\n")
            .map(row => 
                row.split(SEPARATOR)
                    .map(cell => cell.replaceAll("\r", "").trim())
                );
        
        // Supprime la ligne vide finale s'il y en a une
        if (
            rows.length > 0 &&
            rows[rows.length - 1].length === 1 &&
            rows[rows.length - 1][0] === ""
        ) {
            rows.pop();
        }

        return rows;
    } catch (error) {
        throw new Error(`Error parsing CSV content: ${error.message}`);
    };
}

/**
 * Met en forme un tableau de tableaux en chaîne CSV.
 * @param { Array<Array<string>> } data 
 * @returns { string }
 */
const formatCSV = (data) => {
    return data.map(row => row.join(SEPARATOR)).join("\n");
}


module.exports = {
    readCSV,
    readCSVfromFile,
    formatCSV
}