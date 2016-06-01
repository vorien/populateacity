// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// html_fmt.js
//
// copyright (c) 2011 Douglas Rau
// all rights reserved.

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// format

var fmt = {
  'p':          '<p>#{text}</p>',
  'ul':         '<ul>#{text}</ul>',
  'ol':         '<ol>#{text}</ol>',
  'li':         '<li>#{text}</li>',
  'table':      '<table>#{text}</table>',
  'tr':         '<tr>#{text}</tr>',
  'td':         '<td>#{text}</td>'
};
Object.keys(fmt).each(function (key) {
  fmt[key] = new Template(fmt[key]);
});
fmt['loading'] = '<p class="center"><img src="/icons/loading.gif" /></p>';
fmt['working'] = '<p class="center">Working...</p>' + fmt['loading'];

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// add format

function add_fmt (key,string) {
  fmt[key] = new Template(string);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// format html

function fmt_text (text) {
  return text.split("\n\n").map(fmt_p).join('');
}
function fmt_p (text) {
  return eval_fmt('p',{ 'text': text });
}
function fmt_ul (list) {
  return eval_fmt('ul',{ 'text': list.map(fmt_li).join('') });
}
function fmt_ol (list) {
  return eval_fmt('ol',{ 'text': list.map(fmt_li).join('') });
}
function fmt_li (text) {
  return eval_fmt('li',{ 'text': text });
}
function fmt_table (rows) {
  return eval_fmt('table',{ 'text': rows.map(fmt_tr).join('') });
}
function fmt_tr (cells) {
  return eval_fmt('tr',{ 'text': cells.map(fmt_td).join('') });
}
function fmt_td (text) {
  return eval_fmt('td',{ 'text': text });
}
function eval_fmt (fmt_id,obj) {
  return fmt[fmt_id].evaluate(obj);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// multi-column table

function multicol_table (width, list, clear) {
  var rows = multicol_rows(width,list,clear);
  return eval_fmt('table',{ 'text': rows });
}
function multicol_rows (width, list, clear) {
  var col_width = get_col_width(list);
      col_width = Math.floor(col_width * 1.2);
  var n_cols = Math.floor(width / col_width);
  var rem = (list.length % n_cols);
  var pad = (rem > 0) ? (n_cols - rem) : 0;
  var col_len = Math.floor((list.length + pad) / n_cols);
  var rows = [];

  if (pad > 0) {
    var i; for (i = 0; i < pad; i++) { list.push(clear); }
  }
  var i; for (i = 0; i < col_len; i++) {
    var cols = multicol_glob(n_cols,i,col_len,list);
    rows.push(eval_fmt('tr',{ 'text': cols }));
  }
  return rows.join('');
}
function get_col_width (list) {
  var col_width = 0;

  $(document.body).insert('<table id="get_col_width_table"'
    + ' style="position: absolute; width: auto; visibility: hidden;">'
    + '<tr id="get_col_width_tr"><td>&nbsp;</td></tr></table>'
  );
  list.each(function (cell) {
    $('get_col_width_tr').update(cell);
    var width = $('get_col_width_table').getWidth();
    if (width > col_width) { col_width = width; }
  });
  $('get_col_width_table').remove();

  if (col_width < 100) {
    col_width = 100;
  }
  return col_width;
}
function multicol_glob (n_cols, idx, col_len, list) {
  var text = '';

  var c; for (c = 0; c < n_cols; c++) {
    var off_idx = idx + (c * col_len);
    text += list[off_idx];
  }
  return text;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
