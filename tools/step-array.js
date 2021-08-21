class StepArray extends Array {
  constructor({ name, manual, action, params }) {
    super();
    this.step(
      manual,
      () => manual === "停止",
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
      if (value.manual) {
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