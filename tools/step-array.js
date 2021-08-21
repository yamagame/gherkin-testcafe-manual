const debugKeyword = "デバッグ停止";

class StepArray extends Array {
  static Given = "前提";
  static Then = "ならば";
  static When = "もし";
  static And = "かつ";
  static Comment = "#";

  constructor({ name, manual, action, params }) {
    super();
    if (manual !== debugKeyword && manual !== "") {
      manual.split("\n").forEach((manual) => {
        this.comment(
          manual,
          () => manual !== debugKeyword && manual !== "",
          () => `${manual}`
        );
      });
    }
    this.when(
      manual,
      () => manual === debugKeyword,
      () => `${manual}`
    );
  }

  _step(value, step, isValid, callback) {
    if (callback === undefined) {
      callback = isValid;
      isValid = () => true;
    }
    if (
      value !== undefined &&
      value !== "" &&
      value !== false &&
      isValid(value)
    ) {
      const _callback = callback || isValid;
      if (value.manual === debugKeyword) {
        this.push(`${StepArray.When} ${value.manual}`);
      }
      const r = _callback(value);
      if (typeof r === "string") {
        this.push(`${step} ${r}`);
      } else if (Array.isArray(r)) {
        r.forEach((v) => this.push(`${step} ${v}`));
      }
      return true;
    }
    return false;
  }

  given(value, isValid, callback) {
    return this._step(value, StepArray.Given, isValid, callback);
  }

  then(value, isValid, callback) {
    return this._step(value, StepArray.Then, isValid, callback);
  }

  when(value, isValid, callback) {
    return this._step(value, StepArray.When, isValid, callback);
  }

  and(value, isValid, callback) {
    return this._step(value, StepArray.And, isValid, callback);
  }

  comment(value, isValid, callback) {
    return this._step(value, StepArray.Comment, isValid, callback);
  }

  add(expression, step = StepArray.And) {
    if (expression.match(/^\s*[#|もし|かつ|ならば|前提|\*].*/)) {
      this.push(`${expression}`);
    } else {
      this.push(`${step} ${expression}`);
    }
  }
}

module.exports = StepArray;
