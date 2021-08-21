const debugKeyword = "デバッグ停止";

class StepArray extends Array {
  constructor({ name, manual, action, params }) {
    super();
    if (manual !== debugKeyword && manual !== "") {
      manual.split("\n").forEach((manual) => {
        this.step(
          manual,
          () => manual !== debugKeyword && manual !== "",
          () => `# ${manual}`
        );
      });
    }
    this.step(
      manual,
      () => manual === debugKeyword,
      () => `もし ${manual}`
    );
  }

  step(value, isValid, callback) {
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
        this.push(`もし ${value.manual}`);
      }
      const r = _callback(value);
      if (typeof r === "string") {
        this.push(r);
      } else if (Array.isArray(r)) {
        r.forEach((v) => this.push(v));
      }
    }
  }

  add(step, action = "もし") {
    this.push(`${action} ${step}`);
  }
}

module.exports = StepArray;
