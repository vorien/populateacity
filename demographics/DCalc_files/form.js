// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// form.js
//
// copyright (c) 2006-2014 Douglas Rau
// all rights reserved.

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// client form, kill submit event

function client_form (form_id) {
  $(form_id).observe('submit',stop_event);
}
function stop_event (event) {
  event.stop();
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// field value

Element.addMethods([ 'INPUT', 'SELECT' ], {
  'intValue': function (element) {
    return parseInt($(element).getValue());
  },
  'floatValue': function (element) {
    return parseFloat($(element).getValue());
  }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// save prefs

function save_prefs (prefix, field) {
  if (field.type == 'checkbox') {
    value = (field.checked) ? '1' : '0';
  } else if (field.type == 'select-one') {
    value = $(field).getValue();
  } else {
    value = $(field).getValue();
  }
  set_chip(prefix,field.name,value);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
