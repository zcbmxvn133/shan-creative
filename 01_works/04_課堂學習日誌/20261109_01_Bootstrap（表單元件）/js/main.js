// 第一章：Range（範圍滑桿）數值即時顯示
window.addEventListener('DOMContentLoaded', function () {
  const range = document.getElementById('range01');
  const output = document.getElementById('rangeValue');
  if (range && output) {
    range.addEventListener('input', function () { output.textContent = range.value; });
  }
  // 老師第 10 項示範固定的 is-valid 與 is-invalid 外觀，未加動態判斷。
  const search = document.getElementById('searchButton');
  if (search) search.addEventListener('click', function () { console.log('搜尋關鍵字：', document.getElementById('searchText').value); });
});
