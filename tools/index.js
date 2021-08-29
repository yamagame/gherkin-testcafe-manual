/*
 * CSVファイルからシナリオを作成するサンプル
 * 使用例: node index.js test.csv > test.feature
 */
const path = require("path");
const { load } = require("./csv-parser");

const baseDir = process.env["BASE_DIR"] || "";
const filename = process.argv[2] || "./patterns/test.csv";
const basename =
  filename.indexOf(baseDir) === 0 ? filename.replace(baseDir, "") : filename;

const table = load(filename).map(row => {
  return row.reduce((a, v) => {
    const m = { ...v };
    m.value = m.value.replace(/\r\n/g, "").trim();
    a.push(m);
    return a;
  }, []);
});

const find = head => (a, v, i) => v.value === head ? i : a;

const tableHeader = table.slice(0, 2);
const headers = tableHeader[1].map((v, i) => {
  if (tableHeader[0][i].value.indexOf("@") == 0) {
    return tableHeader[0][i];
  }
  return v;
});

const screenNameIndex = headers.reduce(find("画面名"), 0);
const caseNameIndex = headers.reduce(find("項目名"), 0);
const manualIndex = headers.reduce(find("備考"), 0);
const actionIndex = headers.reduce(find("項目1"), 0);

let context = [];
const filled = table.slice(2).map(row => {
  if (row[screenNameIndex].value !== "") context = [];
  if (row[caseNameIndex].value !== "") context = [context[screenNameIndex]];
  row.forEach((cell, i) => {
    if (i === manualIndex) return;
    if (headers[i].value.indexOf("@") !== 0) {
      if (cell.value !== "") context[i] = cell.value;
    }
  });
  return row.map((v, i) => {
    if ((v.value === "" && i > 0 && row[i - 1].value === "") || i === 0)
      return context[i] || "";
    return v.value;
  });
});

const title = name => {
  const t = name.match(/@(.+)/);
  if (t) return `${t[1]}`;
  return t;
};

const scenarios = headers
  .map((v, col) => ({ name: v.value, title: title(v.value), col }))
  .filter(v => v.name.indexOf("@") === 0)
  .map(scenario => {
    const rows = [];
    filled.forEach(row => {
      if (row[scenario.col] !== "") {
        rows.push({
          row: row.filter(
            (v, i) => headers[i].value.indexOf("@") !== 0 && i !== manualIndex
          ),
          manual: row[manualIndex],
          mark: row[scenario.col],
        });
      }
    });
    const screens = rows.reduce(
      (a, v) => {
        if (
          v.row[screenNameIndex] !== a.screen &&
          v.row[caseNameIndex] === ""
        ) {
          a.values = {
            name: v.row[screenNameIndex],
            manual: v.manual,
            action: v.row[actionIndex],
            params: {},
            values: [...v.row].slice(caseNameIndex + 1),
          };
          a.result.push(a.values);
          a.screen = v.row[screenNameIndex];
        } else {
          a.values.params[v.row[caseNameIndex]] = {
            values: [...v.row].slice(caseNameIndex + 1),
            manual: v.manual,
            mark: v.mark,
          };
        }
        return { ...a };
      },
      { result: [], screen: "" }
    ).result;
    return { ...scenario, screens };
  });

const options = process.argv.slice(3);

const StepArray = require("./step-array");
const { scenarioSteps } = require("scenario-steps")(StepArray, options);

console.log(`# language: ja`);
console.log(`# filename: ${basename}`);
console.log(
  `フィーチャ: ${table[0]
    .map(v => v.value)
    .filter(v => v !== "" && v.trim()[0] !== "@")
    .join(" ")}`
);

scenarios.forEach(scenario => {
  const steps = [];
  scenario.screens.forEach(screen => {
    const comment = `# ${screen.name}`;
    if (scenarioSteps[screen.name]) {
      steps.push([comment, ...scenarioSteps[screen.name](screen, options)]);
    } else {
      steps.push([comment, ...scenarioSteps["デフォルト"](screen, options)]);
    }
  });
  console.log("");
  console.log(`  ${scenario.name}`);
  console.log(`  シナリオ: ${scenario.title}`);
  steps.forEach(step => {
    console.log("");
    step.forEach(s => {
      console.log(`    ${s}`);
    });
  });
});
