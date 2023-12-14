// parseCodeToJSON.js

// Import the Polynomial module
const Polynomial = require('./Polynomial');

function parseCodeToJSON(code) {
  function finalize(str) {
      str = str.trim();
      if (str.includes('=')) {
          const assignmentPattern = /[a-zA-Z_]\w*\s*=\s*[^;]+/;
          const match = str.match(assignmentPattern);
          if (match) {
              return match[0];
          }
      }
      return str.trim();
  }

  function countSingleLine(str) {

      function countSubstringOccurrences(str, substring) {
          let count = 0;
          let pos = str.indexOf(substring);

          while (pos !== -1) {
              count++;
              pos = str.indexOf(substring, pos + substring.length);
          }

          return count;
      }

      str = str.replace(/\s+/g, '');
      let ctr = 0;
      const listAdd = ['<', '>', '*', '+', '-', '=', '>>', '<<', '--', '=-', '++', '==', '+=', '-=', '*=', '<='];

      if (countSubstringOccurrences(str, '<<') > 1) {
          ctr -= countSubstringOccurrences(str, '<<') - 1;
      }

      for (let i = 0; i < listAdd.length; i++) {
          if (listAdd[i].length > 1) {
              ctr -= countSubstringOccurrences(str, listAdd[i]);
          } else {
              ctr += countSubstringOccurrences(str, listAdd[i]);
          }
      }
      return ctr;
  }



  const delimiterPattern = /(?:;|,|\(|\))/;
  const tokens = code.split(delimiterPattern).filter(token => token.trim() !== '');

  for (let i = 0; i < tokens.length; i++) {
      tokens[i] = tokens[i].trim();

      if (tokens[i].indexOf('{') === 0 && tokens[i].length > 1) {
          tokens[i] = tokens[i].substring(1);
          tokens.splice(i, 0, "{");
      }

      if (tokens[i].indexOf('}') === 0 && tokens[i].length > 1) {
          tokens[i] = tokens[i].substring(1);
          tokens.splice(i, 0, "}");
      }

      if (tokens[i].includes("for") && !tokens[i + 4].includes('{')) {
          tokens.splice(i + 4, 0, "{");

          if (tokens[i + 5].includes("for") && !tokens[i + 9].includes('{')) {
              tokens.splice(i + 9, 0, "{");
              tokens.splice(i + 11, 0, "}");
              tokens.splice(i + 11, 0, "}");
          } else if (tokens[i + 5].includes("for") && tokens[i + 9].includes('{')) {
              let start = i + 9;
              while (!tokens[start].includes('}')) {
                  start++;
              }
              tokens.splice(start, 0, "}");
          } else {
              tokens.splice(i + 6, 0, "}");
          }
          i += 4;
      }

      if (tokens[i].includes("if") && !tokens[i + 2].includes('{')) {
          tokens.splice(i + 2, 0, "{");
          tokens.splice(i + 4, 0, "}");
      }

      if (tokens[i].includes("else") && !tokens[i].includes('{')) {
          tokens.splice(i + 1, 0, "{", tokens[i].substring(4), "}");
          tokens[i] = "else";
      } else if (tokens[i].includes("else")) {
          tokens.splice(i + 1, 0, tokens[i].substring(4));
          tokens[i] = "else";
      }
  }


  let key = 1;
  const root = {
      key: 0,
      text: 'root',
      fill: "#f68c06", stroke: "#4d90fe",
      count: new Polynomial(),
  }
  let stack = [root];
  let output = [root];
  let isPop = 0;
  let isInfinite = false;
  // console.log(tokens)
  for (let i = 0; i < tokens.length; i++) {
      const token = finalize(tokens[i]);
      token.trim();
      // console.log("TOKEN IS: ", token);
      // if (root && root.count instanceof Polynomial) {
      //     console.log("INSTANCE")
      // }else {
      //     console.log("NOT")
      // }

      if (token === "" || token === ";" || token === ',') {
          continue;
      }
      if (token === "for") {
          let item = {
              key: key,
              type: 'for',
              initializer: finalize(tokens[i + 1]),
              condition: finalize(tokens[i + 2]),
              update: finalize(tokens[i + 3]),
              text: `for ${finalize(tokens[i + 1])} ${finalize(tokens[i + 2])}  ${finalize(tokens[i + 3])}`,
              fill: "#f68c06", stroke: "#4d90fe",
              count: new Polynomial(),
          };

          if (item.condition.includes("<=") && item.condition.includes("n") && item.update.includes("--")) {
              isInfinite = true;
              break;
          }


          if (item.initializer.includes("n") && item.condition.includes("<=")) {
              root.count.addTerm(countSingleLine(item.initializer) + countSingleLine(item.condition), "", 0.0);
              break;
          } else {
              item.count.addTerm(countSingleLine(item.update) + countSingleLine(item.condition), "", 0);
          }


          if (stack.length > 0) {
              item.parent = stack[stack.length - 1].key;
          }
          stack.push(item);
          output.push(item);
          i += 3;
          key++;
          continue;
      } else if (token === "if") {
          let item = {
              key: key,
              type: 'if',
              text: `if ${finalize(tokens[i + 1])}`,
              condition: finalize(tokens[i + 1]),
              fill: "#f68c06", stroke: "#4d90fe",
              count: new Polynomial(),
              elsecount: new Polynomial(),
              isElseAvailable: false,
          };
          if (stack.length > 0) {
              item.parent = stack[stack.length - 1].key;
          }
          item.count.addTerm(countSingleLine(item.condition), "", 0.0);
          item.elsecount.addTerm(countSingleLine(item.condition), "", 0.0);
          stack.push(item);
          output.push(item);
          i++;
          key++;
          continue;
      } else if (token === "else") {
          let item = {
              key: key,
              type: 'else',
              text: 'else',
              fill: "#f68c06", stroke: "#4d90fe",
              count: new Polynomial(),
              // condition: finalize(tokens[i + 2]),
          };

          if (stack.length > 0) {
              item.parent = stack[stack.length - 1].key;
              output[item.parent].isElseAvailable = true;
          }
          stack.push(item);
          output.push(item);
          key++;
          continue;
      } else if (token === "{") {
          continue;
      } else if (token === "}") {
          if (i < tokens.length && tokens[i + 1] !== "else") {
              // if (stack.length > 0 && stack[stack.length - 1].type === "else") {
              //     output[stack[stack.length - 1].parent].elsecount.add(stack[stack.length - 1].count);
              //     stack.pop();
              // }
              if (stack.length > 0 && stack[stack.length - 1].type === "else") {
                  output[stack[stack.length - 1].parent].elsecount.add(stack[stack.length - 1].count);
                  stack.pop();
              }

              if (stack.length > 0 && stack[stack.length - 1].type === "for") {
                  let x = stack[stack.length - 1];
                  x.count.multiply(getBounds(x.initializer, x.condition, x.update));
                  x.count.addTerm(countSingleLine(x.initializer) + countSingleLine(x.condition), "", 0.0);
                  output[x.parent].count.add(x.count);
                  stack.pop();
              }

              if (stack.length > 0 && stack[stack.length - 1].type === "if") {
                  stack[stack.length - 1].count = stack[stack.length - 1].count.checkMax(stack[stack.length - 1].elsecount);
                  output[stack[stack.length - 1].parent].count.add(stack[stack.length - 1].count);
                  stack.pop();
              }
          }
          // console.log("token is: ", token);
          // console.log(stack);
          continue;
      } else {
          let item = {
              key: key,
              type: 'normal',
              text: token,
              fill: "#f68c06", stroke: "#4d90fe",
              count: new Polynomial(),
          };
          item.count.addTerm(countSingleLine(token), '', 0);
          if (stack.length > 0) {
              item.parent = stack[stack.length - 1].key;
              if (item.parent != -1) {
                  // output[item.parent].count += item.count;
                  output[item.parent].count.add(item.count);
              }
          }
          output.push(item);
          key++;
      }
  }

  if (isInfinite) {
      root.count.isValid = true;
  }


  // if (root && root.count instanceof Polynomial) {

  // }else {
  //     root.count = output[1].count;
  // }
  for (let i = 0; i < output.length; i++) {
      convertCountToString(output[i]);
  }


  // console.log(stack);
  // console.log(output);
  return output;
}

function convertCountToString(item) {
  if (item.count instanceof Polynomial) {
      item.count = item.count.print();
  }
}

function getBounds(str1, str2, str3) {
  let p1 = new Polynomial();
  str1 = str1.replace(/\s+/g, "");
  str2 = str2.replace(/\s+/g, "");
  let arr = [str1, str2];
  let pattern2 = /.\s*([a-zA-Z]+)\s*([-+*/]?\s*\d+)?/;
  let numberPattern = /(-?\d+)/;
  // let order = []; // Assuming 'order' is defined elsewhere if needed

  for (let i = 0; i < 2; i++) {
      let input = arr[i];
      let matches;
      let before_n = 0;
      let after_n = 0;
      let variable;
      let index = 1;

      if ((matches = pattern2.exec(input))) {
          variable = matches[1];
          let expression = matches[2] || "";
          before_n = 1;
          if (expression) {
              after_n = parseInt(expression, 10);
          }
      } else if ((matches = numberPattern.exec(input))) {
          let num = matches[1];
          after_n = parseInt(num, 10);
      }

      // if (variable && order.indexOf(variable) === -1) {
      //     order.push(variable);
      // }


      if (i === 0 && variable) { // Summation Case
          let v = str2.substr(str2.indexOf("=") + 1);
          p1.addTerm(-0.5, v, 1.0);
          p1.addTerm(-0.5, v, 0.0);
          p1.addTerm(-after_n, v, 0.0);
          continue;
      } else if (str3.includes("*") || str3.includes("/")) { // Log case
          if ((matches = numberPattern.exec(str3))) {
              let key = parseInt(matches[1], 10);
              index = key / 10;
              if (i === 0) {
                  after_n = Math.ceil(Math.log(after_n) / Math.log(key));
              }
              variable = matches[1] + "log()" + variable;
          }
      } else if (str2.includes("*")) { // Sqrt case
          let v = str2.substring(str2.indexOf("=") + 1);
          let num = (str2.match(/\*/g) || []).length;
          switch (num) {
              case 1:
                  variable = ` sqrt(${v})`;
                  index = 0.5;
                  break;
              case 2:
                  variable = ` cubert(${v})`;
                  index = 0.3;
                  break;
              default:
                  break;
          }
      }

      if (i === 0) { // -lowerbound
          p1.addTerm(-after_n, "", 0.0);
          p1.addTerm(-before_n, variable, index);
      } else { // +upperbound
          p1.addTerm(after_n, "", 0.0);
          p1.addTerm(before_n, variable, index);
      }
  }

  if (str2.includes("<=")) {
      p1.addTerm(1.0, "", 0.0);
  }

  // Assuming there is a way to print the polynomial in the JavaScript version
  // p1.print();

  return p1;
}


// Export the parsing function
module.exports = { parseCodeToJSON };
