module.exports = function (StepArray, options) {
  const scenarioSteps = {
    デフォルト: (screen, options) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.given(name, t => `「${name}」に遷移する`);
      Object.entries(params).forEach(([k, v]) => {
        s.when(
          v,
          t =>
            `${k}は${t.values
              .filter(v => v !== "")
              .map(v => `「${v}」`)
              .join("")}${t.mark !== "◯" ? ` "${t.mark}" ` : ""}を入力`
        );
      });
      s.add("スクリーンショットを撮る");
      s.when(action, t => `${action}`);
      return s;
    },

    ページを開く: (screen, options) => {
      const s = new StepArray(screen);
      s.given(screen, t => `ページ「${t.values[0]}」を開く`);
      s.add("スクリーンショットを撮る");
      return s;
    },

    編集画面: (screen, options) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.then(name, t => `「${name}」に遷移する`);
      s.when(params["名前の変更"], t => `名前は「${t.mark}」を入力`);
      s.when(params["性別"], t => `性別は「${t.values[0]}」を入力`);
      s.when(params["住所"], t => {
        if (t.values[2]) {
          return `住所は「${t.values[0]}」「${t.values[1]}」「${t.values[2]}」を入力`;
        }
        return `住所は「${t.values[0]}」「${t.values[1]}」を入力`;
      });
      s.add("スクリーンショットを撮る");
      s.when(action, t => `${action}`);
      return s;
    },

    設定画面: (screen, options) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.then(name, () => `「${name}」に遷移する`);
      s.when(
        params["端末"],
        t => t.values[0] === "iPhone",
        t => `端末は「${t.values[0]}」、色は「${t.values[1]}」を選択`
      );
      s.when(
        params["端末"],
        t => t.values[0] === "Android",
        t => `端末は「${t.values[0]}」を選択`
      );
      s.when(params["容量"], t => `容量は「${t.values[0]}」を選択`);
      s.add("スクリーンショットを撮る");
      s.when(action, () => `${action}`);
      return s;
    },

    スタート画面: (screen, options) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.then(name, () => `「${name}」に遷移する`);
      s.when(params["アカウント"], t => `アカウントは "${t.mark}" を入力`);
      s.when(params["パスワード"], t => `パスワードは "${t.mark}" を入力`);
      s.add("スクリーンショットを撮る");
      s.when(action, () => `${action}`);
      return s;
    },
  };

  return {
    scenarioSteps,
  };
};
