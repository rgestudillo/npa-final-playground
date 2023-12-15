const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "outputs");
const vmPath = path.join(__dirname, "bytecode-vm/final");
const parsePath = path.join(__dirname, "bytecode-vm/parse");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeNPA = (filepath, userInput) => {
  const jobId = path.basename(filepath).split(".")[0];
  const outPath = path.join(outputPath, `${jobId}.out`);

  const compileCommands = [
    `g++ -o ${outPath} ${path.join(vmPath, "*.c")}`,
    `g++ -o ${outPath} ${path.join(parsePath, "*.c")}`
  ];
  
  const outputs = compileCommands.map((compileCommand, index) => {
    const command = `${compileCommand} && cd ${outputPath} && .\\${jobId}.out ${filepath}`;
    console.log(`Compile command ${index} is: `, command);
    return execSync(command, { input: userInput }).toString();
  });

  console.log("OUTPUTS ARE: ", outputs);
  return outputs;
};

module.exports = {
  executeNPA,
};
