$(document).ready(function() {
  setInterval(checkForDialog, 500);
});

function checkForDialog() {
  var element = $('#drawing-dialog');
  if (element.length > 0) {
    if ($('#drawing-dialog .extended-toolbar').length === 0) {
      modifyDrawingDialog(element);
    }
  }
}


function getCanvas() {
  return $('#drawing-dialog .canvas');
}




function drawShape(obj) {
  window['draw' + capitalize(obj.type)](obj);
}

function drawRect(obj) {
  $('#drawing-dialog .rectangle').simulate('click');
  var xf = obj.x + obj.width;
  var yf = obj.y + obj.height;
  $('#drawing-dialog .canvas')
    .simulate('mousedown', {clientX: x, clientY: y})
    .simulate('mousemove', {clientX: xf, clientY: yf})
    .simulate('mouseup', {clientX: xf, clientY: yf});
}

function capitalize(string) {
  return string[0].toUpperCase() + string.slice(1);
}

