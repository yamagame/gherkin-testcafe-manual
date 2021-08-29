function postRequest(reqeust, data, callback) {
  const XHR = new XMLHttpRequest();
  XHR.onreadystatechange = function () {
    if (XHR.readyState === 4) {
      if (callback) callback(XHR.response);
    }
  };
  XHR.open("POST", reqeust);
  XHR.setRequestHeader("Content-Type", "application/json");
  XHR.send(JSON.stringify(data));
}

function reload() {}

function runTest(fileName, testCase) {
  postRequest("/test", { fileName, testCase }, reload);
}

function generate(fileName) {
  postRequest("/generate", { fileName }, reload);
}
