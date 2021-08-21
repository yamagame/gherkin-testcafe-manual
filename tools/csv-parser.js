const fs = require("fs");
const path = require("path");

const delim = ",";

function parse(src) {
  const row = [];
  let col = [];
  let i = 0;
  let val = "";
  let quat = "";
  do {
    if (src[i] === delim) {
      col.push({ value: val, quat });
      val = "";
      quat = "";
    } else if (src[i] === "\n" || src[i] === "\r") {
      col.push({ value: val, quat });
      val = "";
      quat = "";
      row.push(col);
      col = [];
      if (src[i + 1] === "\n" || src[i + 1] === "\r") {
        i++;
      }
    } else if (src[i] === '"') {
      // val = src[i];
      i++;
      do {
        if (src[i] === '"' && src[i + 1] === '"' && i < src.length - 1) {
          i += 2;
          val += '"';
          continue;
        } else if (src[i] === '"') {
          // val += src[i];
          break;
        }
        val += src[i];
        i++;
      } while (i < src.length);
      quat = '"';
    } else {
      do {
        if (src[i] === delim) {
          col.push({ value: val, quat });
          val = "";
          quat = "";
          break;
        } else if (src[i] === "\n" || src[i] === "\r") {
          col.push({ value: val, quat });
          val = "";
          quat = "";
          row.push(col);
          col = [];
          if (src[i + 1] === "\n" || src[i + 1] === "\r") {
            i++;
          }
          break;
        }
        val += src[i];
        i++;
      } while (i < src.length);
    }
    i++;
  } while (i < src.length);
  col.push({ value: val, quat });
  if (col.length > 0) {
    row.push(col);
  }
  return row;
}

function load(src) {
  let encoding = "utf8";
  let debug = false;
  try {
    return parse(fs.readFileSync(src, { encoding }), { debug });
  } catch (e) {
    return { error: e };
  }
}

function stringify(parsed) {
  let ret = "";
  parsed.forEach((row, i) => {
    if (i > 0) {
      ret += "\n";
    }
    row.forEach((col, i) => {
      if (i > 0) {
        ret += delim;
      }
      ret += col.value;
    });
  });
  return ret;
}

module.exports.parse = parse;
module.exports.load = load;
module.exports.stringify = stringify;
