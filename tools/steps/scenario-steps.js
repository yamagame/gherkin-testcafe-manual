module.exports = function (StepArray) {
  const scenarioSteps = {
    デフォルト: (screen) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.step(name, (t) => `ならば 「${name}」に遷移する`);
      Object.entries(params).forEach(([k, v]) => {
        s.step(
          v,
          (t) =>
            `もし ${k}は${t.values
              .filter((v) => v !== "")
              .map((v) => `「${v}」`)
              .join("")}${t.mark !== "◯" ? ` "${t.mark}" ` : ""}を入力`
        );
      });
      s.add("スクリーンショットを撮る");
      s.step(action, (t) => `もし ${action}`);
      return s;
    },

    ページを開く: (screen) => {
      const s = new StepArray(screen);
      s.step(screen, (t) => `前提 ページ「${t.values[0]}」を開く`);
      s.add("スクリーンショットを撮る");
      return s;
    },

    編集画面: (screen) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.step(name, (t) => `ならば 「${name}」に遷移する`);
      s.step(params["名前の変更"], (t) => `もし 名前は「${t.mark}」を入力`);
      s.step(params["性別"], (t) => `もし 性別は「${t.values[0]}」を入力`);
      s.step(params["住所"], (t) => {
        if (t.values[2]) {
          return `もし 住所は「${t.values[0]}」「${t.values[1]}」「${t.values[2]}」を入力`;
        }
        return `もし 住所は「${t.values[0]}」「${t.values[1]}」を入力`;
      });
      s.add("スクリーンショットを撮る");
      s.step(action, (t) => `もし ${action}`);
      return s;
    },

    設定画面: (screen) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.step(name, () => `ならば 「${name}」に遷移する`);
      s.step(
        params["端末"],
        (t) => t.values[0] === "iPhone",
        (t) => `もし 端末は「${t.values[0]}」、色は「${t.values[1]}」を選択`
      );
      s.step(
        params["端末"],
        (t) => t.values[0] === "Android",
        (t) => `もし 端末は「${t.values[0]}」を選択`
      );
      s.step(params["容量"], (t) => `もし 容量は「${t.values[0]}」を選択`);
      s.add("スクリーンショットを撮る");
      s.step(action, () => `もし ${action}`);
      return s;
    },

    スタート画面: (screen) => {
      const { name, manual, action, params } = screen;
      const s = new StepArray(screen);
      s.step(name, () => `ならば 「${name}」に遷移する`);
      s.step(
        params["アカウント"],
        (t) => `もし アカウントは "${t.mark}" を入力`
      );
      s.step(
        params["パスワード"],
        (t) => `もし パスワードは "${t.mark}" を入力`
      );
      s.add("スクリーンショットを撮る");
      s.step(action, () => `もし ${action}`);
      return s;
    },
  };

  return {
    scenarioSteps,
  };
};
