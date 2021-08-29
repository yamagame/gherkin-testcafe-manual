module.exports = function (StepArray, options) {
  const scenarioSteps = {
    デフォルト: (screen, options) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.then(name, t => `「${name}」に遷移する`);
      Object.entries(params).forEach(([k, v]) => {
        s.when(v, t => {
          const values = t.values.filter(v => v !== "").map(v => `"${v}"`);
          if (values.length > 0) values.push("");
          const mark = t.mark !== "◯" ? `"${t.mark}" ` : "";
          if (values.length <= 0 && mark === "") {
            return `${k}`;
          }
          return `${k}は ${values.join(" ")}${mark}を入力`;
        });
      });
      s.add("スクリーンショットを撮る");
      s.when(action, t => `${action}`);
      return s;
    },

    ページを開く: (screen, options) => {
      const s = new StepArray(screen);
      s.given(screen.params["URL"], t => `ページ "${t.values[1]}" を開く`);
      s.add("スクリーンショットを撮る");
      return s;
    },
  };

  return {
    scenarioSteps,
  };
};
