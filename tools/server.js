const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const csvParser = require("./csv-parser");
const port = process.env.PORT || 3000;
const csvDir = path.join(
  __dirname,
  process.env.DATA_DIRECTORY || "./patterns/"
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

function csvDom(csvArray, _options) {
  const defaultOptions = {
    header: {
      width: 200,
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
              }">${cell.value}</th>`
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

function htmlPage(content, title = "Document") {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" type="text/css" href="/index.css">
      <title>${title}</title>
    </head>
    <body>
      <div class="pageTitle">${title}</div>
      ${content}
    </body>
    </html>`;
}

app.use(express.static("public"));

app.get("/viewer/*", function (req, res) {
  const fileapath = path.join(csvDir, req.params[0]);
  if (!fs.existsSync(fileapath)) {
    return res.sendStatus(404);
  }
  const csvArray = csvParser.load(fileapath);
  res.send(
    htmlPage(csvDom(expandFullSize(csvArray), { colored: true }), req.params[0])
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
        result.push(filepath.replace(csvDir, ""));
      }
    }
  });
  return result;
};

app.get("/", function (req, res) {
  const csvFiles = readdir(csvDir).filter(f => path.extname(f) === ".csv");
  const csvArray = [
    [{ value: "ファイル名" }],
    ...csvFiles.map(file => {
      return [{ value: file, link: `viewer/${file}` }];
    }),
  ];
  res.send(
    htmlPage(
      csvDom(expandFullSize(csvArray), {
        header: {
          width: 600,
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
