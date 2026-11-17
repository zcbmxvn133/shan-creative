// 第二章：jQuery 即時監聽、三個驗證旗標、SweetAlert2 錯誤提示
// 依老師截圖：Email 僅判斷字數 5～10，尚未檢查信箱格式。
let flag_username = false;
let flag_nickname = false;
let flag_email = false;

$(function () {
  function checkField(selector, min, max, setFlag) {
    const $field = $(selector);
    const length = $field.val().length;
    const valid = length >= min && length <= max;
    $field.removeClass(valid ? 'is-invalid' : 'is-valid');
    $field.addClass(valid ? 'is-valid' : 'is-invalid');
    setFlag(valid);
  }
  $('#username').on('input', function () {
    checkField('#username', 1, 6, function (valid) { flag_username = valid; });
  });
  $('#nickname').on('input', function () {
    checkField('#nickname', 2, 8, function (valid) { flag_nickname = valid; });
  });
  $('#email').on('input', function () {
    checkField('#email', 5, 10, function (valid) { flag_email = valid; });
  });

  $('#ok_btn').on('click', function () {
    // 未輸入的欄位也顯示驗證狀態
    $('#username, #nickname, #email').trigger('input');
    if (flag_username && flag_nickname && flag_email) {
      const username = $('#username').val();
      const nickname = $('#nickname').val();
      const email = $('#email').val();
      const myclass = $('#myclass').val();
      // 使用 .text() 防止使用者文字被當成 HTML 執行
      const $box = $('#showmessage').empty();
      $('<div class="h2">').text('姓名：' + username).appendTo($box);
      $('<div class="h2">').text('暱稱：' + nickname).appendTo($box);
      $('<div class="h2">').text('Email：' + email).appendTo($box);
      $('<div class="h2">').text('最有興趣的課程：' + (myclass || '未填寫')).appendTo($box);
    } else {
      Swal.fire({ title: '欄位有錯誤!', text: '欄位有錯誤，請修正!', icon: 'error' });
    }
  });
  // 取消按鈕：老師畫面已出現按鈕，此清除行為為練習補充。
  $('#cancel_btn').on('click', function () {
    $('#courseForm')[0].reset();
    $('#courseForm .form-control').removeClass('is-valid is-invalid');
    flag_username = flag_nickname = flag_email = false;
    $('#showmessage').empty()
      .append($('<div class="h2">').text('姓名：xxx'))
      .append($('<div class="h2">').text('暱稱：xxx'))
      .append($('<div class="h2">').text('Email：xxx'))
      .append($('<div class="h2">').text('最有興趣的課程：xxx'));
  });
});
