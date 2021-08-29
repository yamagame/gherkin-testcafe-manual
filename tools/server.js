const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const express = require("express");
const app = express();
const csvParser = require("./csv-parser");
const port = process.env.PORT || 3000;
const patternDir = path.join(
  __dirname,
  process.env.PATTERN_DIR || "./patterns/"
);
const featureDir = path.join(
  __dirname,
  process.env.FEATURE_DIR || "./features/"
);

function escapeHtml(string) {
  if (typeof string !== "string") {
    return string;
  }
  return string.replace(/[&'`"<>]/g, function (match) {
    return {
      "&": "&amp;",
      "'": "&#x27;",
      "`": "&#x60;",
      '"': "&quot;",
      "<": "&lt;",
      ">": "&gt;",
    }[match];
  });
}

function removeQuote(value) {
  const ts = [/^"(.+)"$/, /^'(.+)'$/];
  for (let i = 0; i < ts.length; i++) {
    const m = value.trim().match(ts[i]);
    if (m) {
      return escapeHtml(m[1].replace(/""/g, '"'));
    }
  }
  return escapeHtml(value);
}

function expandFullSize(csvArray) {
  let maxw = 0;
  csvArray.forEach(col => {
    maxw = col.length > maxw ? col.length : maxw;
  });
  csvArray.forEach(col => {
    if (col.length < maxw) {
      for (let i = col.length; i < maxw; i++) {
        col.push({ value: "" });
      }
    }
  });
  return csvArray;
}

function convertToFeaturePath(fileName) {
  const parsed = path.parse(fileName);
  return path.join(featureDir, parsed.dir, `${parsed.name}.feature`);
}

function convertToFeatureName(fileName) {
  const parsed = path.parse(fileName);
  return path.join(parsed.dir, `${parsed.name}.feature`);
}

function testButton(title, value) {
  if (value.trim().indexOf("@") === 0) {
    return `<button class="testButton" onClick="runTest('${title}', '${value}');">${value}</button>`;
  }
  return value;
}

function generateButton(title, value) {
  return `<button class="testButton" onClick="generate('${title}');">${value}</button>`;
}

function csvDom(csvArray, _options, title) {
  const defaultOptions = {
    header: {
      width: 150,
    },
    colored: false,
    dobuleHeader: true,
  };
  const options = { ...defaultOptions, ..._options };
  return `<table class="csvTable">\n${csvArray
    .map((col, i) => {
      const head = css =>
        `<thead><tr>${col
          .map(
            (cell, j) =>
              `<th width=${options.header.width} class="${css} ${
                csvArray[0][j].value.trim().indexOf("@") == 0
                  ? `fileNameBG`
                  : `caseNameBG`
              }">${testButton(title, cell.value)}</th>`
          )
          .join("")}</tr></thead>\n<tbody>`;
      if (i === 0) {
        return `${head("top")}`;
      } else if (i === 1 && options.dobuleHeader) {
        return `${head("second")}`;
      } else {
        return `<tr>${col
          .map(cell => {
            const screenRow = col[0].value.trim() !== "" && options.colored;
            const check = value => (value ? value : "");
            if (cell.link) {
              return `<td class="${check(screenRow && "screenBG")}"><a href="${
                cell.link
              }">${removeQuote(cell.value)}</a></td>`;
            } else {
              return `<td class="${check(
                screenRow && "screenBG"
              )}">${removeQuote(cell.value)}</td>`;
            }
          })
          .join("")}</tr>\n`;
      }
    })
    .join("")}</tbody>\n</table>`;
}

function topCsvDom(csvArray) {
  return `<table class="topCsvDom">\n${csvArray
    .map((col, i) => {
      if (i === 0) {
        const head = () =>
          `<thead><tr>${col
            .map((cell, j) => `<th class="fileNameBG">${cell.value}</th>`)
            .join("")}</tr></thead>\n<tbody>`;
        return `${head()}`;
      } else {
        return `<tr>${col
          .map(cell => {
            if (cell.link) {
              return `<td ><a href="${cell.link}">${removeQuote(
                cell.value
              )}</a></td>`;
            } else if (cell.button) {
              return `<td>${generateButton(
                csvArray[i][0].value,
                removeQuote(cell.button)
              )}</td>`;
            } else {
              return `<td>${removeQuote(cell.value)}</td>`;
            }
          })
          .join("")}</tr>\n`;
      }
    })
    .join("")}</tbody>\n</table>`;
}

function htmlPage(content, title = "Document") {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" type="text/css" href="/index.css">
      <script type="text/javascript" src="/index.js"></script>
      <title>${title}</title>
    </head>
    <body>
      <div class="pageTitle">${title}</div>
      ${content}
    </body>
    </html>`;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.post("/test", async (req, res) => {
  const { fileName, testCase } = req.body;
  const parsed = path.parse(fileName);
  const featurePath = convertToFeaturePath(fileName);
  const featureStep = path.join(featureDir, parsed.dir, "steps");
  const run = (csvFile, nodePath) => {
    return new Promise((resolve, reject) => {
      const command = spawn(`node`, [
        `test.js`,
        featureStep,
        featurePath,
        testCase,
      ]);
      command.stdout.on("data", chunk => {
        process.stdout.write(chunk.toString());
      });
      command.on("exit", function (code) {
        return resolve(code);
      });
      command.on("error", function (err) {
        return reject(err);
      });
    });
  };
  await run(featurePath, featureStep);
  res.sendStatus(200);
});

app.post("/generate", async (req, res) => {
  const { fileName } = req.body;
  const csvFile = path.join(patternDir, fileName);
  const parsed = path.parse(fileName);
  const featurePath = convertToFeaturePath(fileName);
  const patternStep = path.join(patternDir, parsed.dir, "steps");
  const run = (csvFile, nodePath, outFile) => {
    return new Promise((resolve, reject) => {
      const dest = fs.createWriteStream(outFile, "utf8");
      const command = spawn(`node`, [`index.js`, csvFile], {
        env: { ...process.env, NODE_PATH: nodePath },
      });
      command.stdout.on("data", chunk => {
        process.stdout.write(chunk.toString());
        dest.write(chunk.toString());
      });
      command.on("exit", function (code) {
        return resolve(code);
      });
      command.on("error", function (err) {
        return reject(err);
      });
    });
  };
  await run(csvFile, patternStep, featurePath);
  res.sendStatus(200);
});

app.get("/viewer/*", function (req, res) {
  const fileapath = path.join(patternDir, req.params[0]);
  if (!fs.existsSync(fileapath)) {
    return res.sendStatus(404);
  }
  const csvArray = csvParser.load(fileapath);
  res.send(
    htmlPage(
      csvDom(expandFullSize(csvArray), { colored: true }, req.params[0]),
      req.params[0]
    )
  );
});

const readdir = dir => {
  const files = fs.readdirSync(dir);
  let result = [];
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      result = [...result, ...readdir(filepath)];
    } else if (stat.isFile()) {
      if (path.extname(filepath) === ".csv") {
        result.push(filepath.replace(patternDir, ""));
      }
    }
  });
  return result;
};

app.get("/", function (req, res) {
  const csvFiles = readdir(patternDir).filter(f => path.extname(f) === ".csv");
  const csvArray = [
    [{ value: "CSVファイル名" }, { value: "フィーチャ名" }],
    ...csvFiles.map(file => {
      return [
        { value: file, link: `viewer/${file}` },
        { value: convertToFeatureName(file) },
        { button: `シナリオ作成` },
      ];
    }),
  ];
  res.send(
    htmlPage(
      topCsvDom(expandFullSize(csvArray), {
        header: {
          width: 200,
        },
        dobuleHeader: false,
      }),
      "CSVファイル一蘭"
    )
  );
});

app.listen(port, () => {
  console.log(`env-manager app listening at http://localhost:${port}`);
});
