const fs = require('fs');
const path = require('path');

/**
 * Charge les redirections dans l'application web.
 * @param {import('express').Express} webApp 
 */
const loadRedirection = (webApp) => {
    // Fichier contenant l'ensemble des redirections
    const redirectionsPath = path.join(__dirname, '..', 'redirections');

    fs.readdirSync(redirectionsPath).forEach(file => {
        // Empêche de charger les fichiers non JS
        if (file.endsWith('.js')) {
            const fileRedirect = require(path.join(redirectionsPath, file));
            
            // Ajoute la redirection à l'application web
            webApp.get(fileRedirect.redirection, (req, res) => {
                fileRedirect.run(req, res, __dirname);
            });
        }

    });
}

module.exports = {
    loadRedirection
};