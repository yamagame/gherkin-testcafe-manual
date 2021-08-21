/*
 * CSVファイルからシナリオを作成するサンプル
 * 使用例: node index.js test.csv > test.feature
 */
const path = require("path");
const { load } = require("./csv-parser");

const filename = process.argv[2] || "./test.csv";
const table = load(filename);

const find = (head) => (a, v, i) => v.value === head ? i : a;

const headers = table.slice(0, 1)[0];

const screenNameIndex = headers.reduce(find("画面名"), 0);
const caseNameIndex = headers.reduce(find("項目名"), 0);
const manualIndex = headers.reduce(find("手動"), 0);
const actionIndex = headers.reduce(find("項目1"), 0);

let context = [];
const filled = table.slice(1).map((row) => {
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

const title = (name) => {
  const t = name.match(/@(.+)/);
  if (t) return `${t[1]}`;
  return t;
};

const scenarios = headers
  .map((v, col) => ({ name: v.value, title: title(v.value), col }))
  .filter((v) => v.name.indexOf("@") === 0)
  .map((scenario) => {
    const rows = [];
    filled.forEach((row) => {
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

const { scenarioSteps } = require("./scenario-steps");

console.log(`# language: ja`);
console.log(`フィーチャ: ${path.parse(filename).name}`);

scenarios.forEach((scenario) => {
  const steps = [];
  scenario.screens.forEach((screen) => {
    if (scenarioSteps[screen.name]) {
      steps.push(scenarioSteps[screen.name](screen));
    } else {
      steps.push(scenarioSteps["デフォルト"](screen));
    }
  });
  {
    console.log("");
    console.log(`  ${scenario.name}`);
    console.log(`  シナリオ: ${scenario.title}`);
    steps.forEach((step) => {
      console.log("");
      step.forEach((s) => {
        console.log(`    ${s}`);
      });
    });
  }
});
