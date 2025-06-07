// scripts/update-docs.js
const fs = require("fs");
const path = require("path");

// Mapping des fichiers JSON vers les pages Markdown
const FILE_MAPPING = {
  "config/sepolia.json": "book-documentation/src/2.1_deployment_addresses.testnet.md",
  "config/polygon.json": "book-documentation/src/2.2_deployment_addresses.mainnet.md",
};

// Fonction pour convertir timestamp en date lisible
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fonction pour parser un tableau Markdown
function parseMarkdownTable(content) {
  const lines = content.split("\n");
  const tableStart = lines.findIndex((line) => line.includes("| Contract | Address | Last Update |"));

  if (tableStart === -1) {
    throw new Error("Tableau non trouvé dans le fichier Markdown");
  }

  const headerLine = tableStart;
  const separatorLine = tableStart + 1;

  // Trouver la fin du tableau
  let tableEnd = tableStart + 2;
  while (tableEnd < lines.length && lines[tableEnd].trim().startsWith("|")) {
    tableEnd++;
  }

  return {
    beforeTable: lines.slice(0, headerLine),
    header: lines[headerLine],
    separator: lines[separatorLine],
    rows: lines.slice(headerLine + 2, tableEnd),
    afterTable: lines.slice(tableEnd),
    tableStart: headerLine,
    tableEnd: tableEnd,
  };
}

// Fonction pour mettre à jour une page Markdown
function updateMarkdownPage(jsonPath, mdPath) {
  console.log(`Mise à jour de ${mdPath} avec les données de ${jsonPath}`);

  // Lire les données JSON
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // Lire le fichier Markdown existant
  const mdContent = fs.readFileSync(mdPath, "utf8");

  // Parser le tableau existant
  const table = parseMarkdownTable(mdContent);

  // Créer un map des contrats existants pour préserver l'ordre
  const existingContracts = new Map();
  table.rows.forEach((row, index) => {
    const cells = row
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell);
    if (cells.length >= 3) {
      existingContracts.set(cells[0], {
        index: index,
        address: cells[1],
        lastUpdate: cells[2],
      });
    }
  });

  // Mettre à jour les données
  const updatedRows = [...table.rows];
  const newContracts = [];

  Object.entries(jsonData).forEach(([contractName, data]) => {
    const formattedDate = formatTimestamp(data.timestamp);
    const newRow = `| ${contractName} | ${data.address} | ${formattedDate} |`;

    if (existingContracts.has(contractName)) {
      // Mettre à jour le contrat existant à sa position
      const existingIndex = existingContracts.get(contractName).index;
      updatedRows[existingIndex] = newRow;
    } else {
      // Nouveau contrat à ajouter à la fin
      newContracts.push(newRow);
    }
  });

  // Ajouter les nouveaux contrats
  const finalRows = [...updatedRows, ...newContracts];

  // Reconstruire le fichier Markdown
  const newContent = [...table.beforeTable, table.header, table.separator, ...finalRows, ...table.afterTable].join(
    "\n"
  );

  // Écrire le fichier mis à jour
  fs.writeFileSync(mdPath, newContent);
  console.log(`✅ ${mdPath} mis à jour avec ${Object.keys(jsonData).length} contrats`);
}

// Fonction principale
function main() {
  const changedFiles = process.argv[2];

  if (!changedFiles || changedFiles.trim() === "") {
    console.log("Aucun fichier JSON modifié");
    return;
  }

  const files = changedFiles
    .trim()
    .split(" ")
    .filter((f) => f);

  files.forEach((file) => {
    if (FILE_MAPPING[file]) {
      try {
        updateMarkdownPage(file, FILE_MAPPING[file]);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de ${file}:`, error.message);
        process.exit(1);
      }
    } else {
      console.log(`Fichier ${file} ignoré (pas de mapping défini)`);
    }
  });

  console.log("Mise à jour terminée avec succès !");
}

// Vérifier que le script n'est pas importé
if (require.main === module) {
  main();
}

module.exports = { updateMarkdownPage, formatTimestamp };
