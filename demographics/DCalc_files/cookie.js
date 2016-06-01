// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// cookie.js
//
// copyright (c) 2006-2011 Douglas Rau
// all rights reserved

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// configuration

var default_cookie_opts = {
  'domain':     '.d20srd.org',
  'path':       '/',
  'secure':     false
};
var forthwith = cookie_date(2000,1,1,0,0,0);
var never = cookie_date(2037,1,1,0,0,0);
var cookie_jar = { };

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// load cookies

function load_cookies () {
  var set = document.cookie.split('; ');

  for (i = 0; i < set.length; i++) {
    var list = set[i].split('=');
    var key = list[0];
    var value = unescape(list[1]);

    if (match = /^json:(.+)/.exec(value)) {
      value = match[1].evalJSON();
    }
    cookie_jar[key] = value;
  }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// get cookie

function get_cookie (name) {
  if (name) {
    return cookie_jar[name];
  } else {
    return cookie_jar;
  }
}
function get_cookies () {
  return cookie_jar;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// set cookie

function set_cookie (name,value,opts) {
  if (Object.isString(value)) {
    esc_v = escape(value);
  } else {
    esc_v = 'json:' + escape(Object.toJSON(value));
  }
  var list = [ name + '=' + esc_v ];

  if (opts.expires) {
    list.push(set_expires(opts.expires));
  } else if (default_cookie_opts.expires) {
    list.push(set_expires(default_cookie_opts.expires));
  }
  if (opts.domain) {
    list.push(set_domain(opts.domain));
  } else if (default_cookie_opts.domain) {
    list.push(set_domain(default_cookie_opts.domain));
  }
  if (opts.path) {
    list.push(set_path(opts.path));
  } else if (default_cookie_opts.path) {
    list.push(set_path(default_cookie_opts.path));
  }
  if (opts.secure) {
    list.push('secure');
  } else if (default_cookie_opts.secure) {
    list.push('secure');
  }
  document.cookie = list.join('; ');
  cookie_jar[name] = value;
}
function set_expires (expires) {
  if (expires == 'now') {
    expires = forthwith;
  } else if (expires == 'never') {
    expires = never;
  }
  return 'expires=' + expires.toUTCString();
}
function set_domain (domain) {
  return 'domain=' + domain;
}
function set_path (path) {
  return 'path=' + path;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// persistent cookie

function persistent_cookie (name,value,opts) {
  if (opts) {
    opts.expires = never;
  } else {
    opts = { 'expires': never };
  }
  set_cookie(name,value,opts);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// set persistent chip

function set_chip (name,key,value,opts) {
  if (cookie_jar[name]) {
    cookie = cookie_jar[name];
  } else {
    cookie = { };
  }
  cookie[key] = value;
  persistent_cookie(name,cookie,opts);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// delete cookie

function delete_cookie (name,opts) {
  if (cookie_jar[name]) {
    if (opts) {
      opts.expires = forthwith;
    } else {
      opts = { 'expires': forthwith };
    }
    set_cookie(name,'',opts);
    delete cookie_jar[name];
  }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// get date, fix for macs

function cookie_date (y,m,d,h,n,s) {
  var then = new Date(y,m,d,h,n,s);
  return fix_time(then);
}
function cookie_days (d) {
  var then = new Date();
      then.setTime(then.getTime() + (d * 86400 * 1000));
  return fix_time(then);
}
function fix_time (then) {
  var base = new Date(0);
  var skew = base.getTime();

  if (skew > 0) {
    then.setTime(then.getTime() - skew);
  }
  return then;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// showtime

load_cookies();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
