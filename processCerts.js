const fs = require("fs");
const readline = require("readline");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function renameFile(oldName, newName) {
  if (fs.existsSync(oldName)) {
    fs.renameSync(oldName, newName);
  } else {
    console.error(`File ${oldName} does not exist.`);
  }
}

rl.question("Enter the filename (without extension): ", (filename) => {
  // Rename gd_bundle-g2-g1.crt
  renameFile("gd_bundle-g2-g1.crt", `${filename}.gd_bundle.crt`);

  // Find the file with random hex numbers and .crt extension
  const files = fs.readdirSync(process.cwd());
  const hexFileCrt = files.find((file) => /^[0-9a-f]+\.crt$/.test(file));
  if (hexFileCrt) {
    renameFile(hexFileCrt, `${filename}.crt`);

    const hexBaseName = path.basename(hexFileCrt, ".crt");
    renameFile(`${hexBaseName}.pem`, `${filename}.pem`);
  } else {
    console.error(
      "Could not find file with random hex name and .crt extension."
    );
    process.exit(1);
  }

  // Proceed to generate output files
  const certData = fs.readFileSync(`${filename}.crt`, "utf8");
  const bundleData = fs.readFileSync(`${filename}.gd_bundle.crt`, "utf8");

  const sections = bundleData
    .split("-----END CERTIFICATE-----")
    .filter((section) => section.trim() !== "")
    .map((section) => `${section.trim()}-----END CERTIFICATE-----`);

  if (sections.length !== 3) {
    console.error("The bundle file should have exactly 3 certificates.");
    process.exit(1);
  }

  // Write each section to its own file
  fs.writeFileSync(`${filename}.gd1.crt`, sections[0]);
  fs.writeFileSync(`${filename}.gd2.crt`, sections[1]);
  fs.writeFileSync(`${filename}.gd3.crt`, sections[2]);

  // Write combined chain certificate
  const combinedData = `${bundleData.trim()}\n${certData}`;
  fs.writeFileSync(`${filename}.chain.crt`, combinedData);

  console.log("Files have been generated successfully.");
  rl.close();
});
