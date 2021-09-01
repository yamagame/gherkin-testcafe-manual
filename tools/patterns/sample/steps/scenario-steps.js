module.exports = function (StepArray, options) {
  const scenarioSteps = {
    デフォルト: (screen, options) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.then(name, t => `「${name}」に遷移する`);
      s.step(params);
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
