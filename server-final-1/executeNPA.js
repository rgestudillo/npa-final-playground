const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "outputs");
const vmPath = path.join(__dirname, "bytecode-vm/final");
const parsePath = path.join(__dirname, "bytecode-vm/parse");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}





const executeNPA = async (filepath, userInput, syntax) => {
  const jobId = path.basename(filepath).split(".")[0];
  const outPath = path.join(outputPath, `${jobId}.out`);

  const syntaxPath1 = path.join(__dirname, "bytecode-vm/final/syntax.txt");
  const syntaxPath2 = path.join(__dirname, "bytecode-vm/parse/syntax.txt");

  await fs.writeFileSync(syntaxPath1, syntax);
  await fs.writeFileSync(syntaxPath2, syntax);

  const compileCommands = [
    `g++ -o ${outPath} ${path.join(vmPath, "*.c")}`,
    `g++ -o ${outPath} ${path.join(parsePath, "*.c")}`
  ];
  
  const outputs = compileCommands.map((compileCommand, index) => {
    const command = `${compileCommand} && cd ${outputPath} && .\\${jobId}.out ${filepath}`;
    // console.log(`Compile command ${index} is: `, command);
    console.log("Current working directory:", process.cwd());
    return execSync(command, { input: userInput }).toString();
  });

  console.log("OUTPUTS ARE: ", outputs);
  return outputs;
};



module.exports = {
  executeNPA,
};
