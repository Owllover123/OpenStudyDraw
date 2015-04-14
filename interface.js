var FONTS = [
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Century Gothic',
  'Copperplate Gothic Light',
  'Courier New',
  'Georgia',
  'Gill Sans',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Palatino Linotype',
  'Tahoma',
  'Times New Roman'
];

var MODES = {
  SELECT: 0,
  STROKE: 1,
  TEXT: 2,
  FILL: 3
};
var MODE = MODES.STROKE;

var EXTENDED_DRAWING_DATA = {};

var PREVIOUS_DRAWINGS = [];


function getDrawingIds(string) {
  var drawingRegex = /\|dw\:(\d+)\:dw\|/gi;
  var drawingIds = [];
  var match = drawingRegex.exec(string);
  while (match !== null) {
    drawingIds.push(match[1]);
    match = drawingRegex.exec(string);
  }
  return drawingIds;
}

function setToolbarMode(mode) {
  MODE = mode;
  $('.extended-toolbar > *').hide();
  switch (mode) {
    case MODES.STROKE:
      $('#stroke-color').show();
      $('#stroke-width-label').show();
      $('#stroke-width').show();
      break;
    case MODES.TEXT:
      $('#stroke-color').show();
      $('#font-family').show();
      $('#font-size').show();
      break;
    case MODES.FILL:
      $('#stroke-color').show();
      $('#fill-color').show();
      $('#fill').show();
      $('#fill-label').show();
      $('#stroke-width-label').show();
      $('#stroke-width').show();
      break;
  }
}

function getExtendedData(mode) {
  var result = {};
  switch (mode) {
    case MODES.STROKE:
      result.stroke = $('#stroke-color').val();
      try {
        var strokewidth = parseInt($('#stroke-width').val(), 10);
      } catch(e) {
        var strokewidth = 1;
        $('#stroke-width').val('1');
      }
      result['stroke-width'] = strokewidth;
      break;
    case MODES.TEXT:
      result.fill = $('#stroke-color').val();
      result['font-family'] = $('#font-family').val();
      try {
        var fontsize = parseInt($('#font-size').val(), 10);
      } catch(e) {
        var fontsize = 14;
        $('#font-size').val('14');
      }
      result['font-size'] = fontsize + 'px';
      result.font = result['font-size'] + ' "' + result['font-family'] + '"';
      break;
    case MODES.FILL:
      result.stroke = $('#stroke-color').val();
      if ($('#fill').prop('checked')) {
        result.fill = $('#fill-color').val();
      } else {
        delete result.fill
      }
      try {
        var strokewidth = parseInt($('#stroke-width').val(), 10);
      } catch(e) {
        var strokewidth = 1;
        $('#stroke-width').val('1');
      }
      result['stroke-width'] = strokewidth;
      break;
  }
  return result;
}

function createFontSelect(id, values) {
  var select = $(document.createElement('select'))
    .attr('id', id);
  for (var i = 0; i < values.length; i++) {
    var option = $(document.createElement('option'))
      .val(values[i])
      .text(values[i]);
    var optgroup = $(document.createElement('optgroup'))
      .css('font-family', values[i])
      .append(option);
    select.append(optgroup);
  }
  return select;
}

function createInput(id, type) {
  var input = $(document.createElement('input')).attr('type', type)
    .attr('id', id);
  return input;
}

function createExtendedToolbar() {
  var stroke_picker = createInput('stroke-color', 'color');
  var fill_checkbox = createInput('fill', 'checkbox');
  var fill_label = $(document.createElement('label'))
    .attr('id', 'fill-label')
    .attr('for', 'fill')
    .text('Fill');
  var stroke_width_label = $(document.createElement('label'))
    .attr('id', 'stroke-width-label')
    .attr('for', 'stroke-width')
    .text('Width');
  var stroke_width = createInput('stroke-width', 'number')
    .attr('min', '1').attr('max', '72').val('1');
  var fill_picker = createInput('fill-color', 'color');
  var font_picker = createFontSelect('font-family', FONTS);
  var font_size = createInput('font-size', 'number')
    .attr('min', '6').attr('max', '72').val('14');

  var extended_toolbar = $(document.createElement('div'))
    .addClass('extended-toolbar')
    .append(stroke_picker)
    .append(fill_checkbox)
    .append(fill_label)
    .append(fill_picker)
    .append(stroke_width_label)
    .append(stroke_width)
    .append(font_picker)
    .append(font_size);

  return extended_toolbar;
}

function createDrawingData() {
  return {
    shapes: [],
    width: 500,
    height: 300
  };
}


function parseDrawingData() {
  return JSON.parse('{' + $('#drawing-data').val() + '}');
}

function deriveDrawingData(data) {
  var drawings = [];
  for (x in data) {
    drawings.push()
    drawings.push('"' + x + '": ' + JSON.stringify(data[x]));
  }
  return drawings.join(',');
}


function modifyDrawingData(id) {
  var extendedData = EXTENDED_DRAWING_DATA.current
  delete EXTENDED_DRAWING_DATA.current;
  EXTENDED_DRAWING_DATA[id] = extendedData;
  var drawingData = parseDrawingData();
  if (typeof drawingData[id] !== 'undefined') {
    var data = drawingData[id];
    var length = Math.min(data.shapes.length, extendedData.shapes.length);
    for (var i = 0; i < length; i++) {
      if (typeof extendedData.shapes[i] !== 'undefined') {
        data.shapes[i] = $.extend(data.shapes[i], extendedData.shapes[i]); 
      }
    }
  }
  $('#drawing-data').val(deriveDrawingData(drawingData));
}

function modifyDrawingDialog(dialog) {
  EXTENDED_DRAWING_DATA.current = createDrawingData();
  dialog.find('.editor').prepend(createExtendedToolbar);
  dialog.find('.selection').click(function() {
    setToolbarMode(MODES.SELECT);
  });
  dialog.find('.pencil').click(function() {
    setToolbarMode(MODES.FILL);
  });
  dialog.find('.text').click(function() {
    setToolbarMode(MODES.TEXT);
  });
  dialog.find('.line').click(function() {
    setToolbarMode(MODES.STROKE);
  });
  dialog.find('.rectangle').click(function() {
    setToolbarMode(MODES.FILL);
  });
  dialog.find('.ellipse').click(function() {
    setToolbarMode(MODES.FILL);
  });
  setToolbarMode(MODES.FILL);
  
  dialog.find('.actions .insert').click(function() {
    var drawings = getDrawingIds($('#reply-body').val());
    for (var i = 0; i < drawings.length; i++) {
      if (PREVIOUS_DRAWINGS.indexOf(drawings[i]) === -1) {
        modifyDrawingData(drawings[i]);
        break;
      }
    }
  });
  
  dialog.find('.extended-toolbar').change(function() {
    if (MODE === MODES.TEXT) {
      var element = dialog.find('svg').children().last();
      var id = element.attr('id');
      var data = getExtendedData(MODE);
      EXTENDED_DRAWING_DATA.current.shapes[id] = data;
      element
        .css('color', data.fill)
        .css('font-family', data['font-family'])
        .css('font-size', data['font-size']);
      var textarea = dialog.find('textarea.whiteboard-text-input')
        .css('color', data.fill)
        .css('font-family', data['font-family'])
        .css('font-size', data['font-size'])
        .focus();
    }
  });
  
  $('#reply-body').change(function() {
    PREVIOUS_DRAWINGS = getDrawingIds($('#reply-body').val());
  });
  PREVIOUS_DRAWINGS = getDrawingIds($('#reply-body').val());
  
  dialog.find('.canvas').mousedown(function() {
    if (MODE !== MODES.SELECT) {
      var element = dialog.find('svg').children().last();
      var id = element.attr('id');
      var data = getExtendedData(MODE);
      EXTENDED_DRAWING_DATA.current.shapes[id] = data;
        
      if (MODE === MODES.TEXT) {
        element
          .css('color', data.fill)
          .css('font-family', data['font-family'])
          .css('font-size', data['font-size']);
        var textarea = dialog.find('textarea.whiteboard-text-input')
          .css('color', data.fill)
          .css('font-family', data['font-family'])
          .css('font-size', data['font-size']);
      }
      for (var i = 0; i <= id; i++) {
        var shape = EXTENDED_DRAWING_DATA.current.shapes[i];
        for (x in shape) {
          element.attr(x, data[x]);
        }
      }
    }
  });
}