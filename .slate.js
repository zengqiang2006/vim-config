///////////////////////////// Imports //////////////////////////////////////////
slate.source("~/.slate.d/configure.js");
slate.source("~/.slate.d/golden.js");

///////////////////////////// Environment //////////////////////////////////////
slate.configAll({
  "defaultToCurrentScreen"         : true,
  "secondsBetweenRepeat"           : 0.1,
  "checkDefaultsOnLoad"            : true,
  "focusCheckWidthMax"             : 3000,
  "orderScreensLeftToRight"        : true,
  "windowHintsShowIcons"           : true,
  "windowHintsIgnoreHiddenWindows" : false,
  "windowHintsSpread"              : true
});

var BROWSER  = "Google Chrome",
    TERMINAL = 'iTerm',
    CHAT     = 'HipChat';

///////////////////////////// Layouts //////////////////////////////////////////
// push active window around
var push = (function() {
  var push = {};

  // create a "push screen to left/right/top/bottom half"
  var pushHalf = function(direction, axis) {
    return {
      "direction" : direction,
      "style"     : "bar-resize:screenSize" + axis + "/2"
    };
  };

  // create a "push to one of the 4 quarters"
  var pushQuarter = function(direction) {
    return {
      "direction" : direction,
      "width"     : "screenSizeX/2",
      "height"    : "screenSizeY/2"
    };
  };

  push.right  = slate.operation("push", pushHalf( "right", "X"));
  push.left   = slate.operation("push", pushHalf(  "left", "X"));
  push.top    = slate.operation("push", pushHalf(   "top", "Y"));
  push.bottom = slate.operation("push", pushHalf("bottom", "Y"));

  push.topLeft     = slate.operation("corner", pushQuarter(    "top-left"));
  push.topRight    = slate.operation("corner", pushQuarter(   "top-right"));
  push.bottomLeft  = slate.operation("corner", pushQuarter( "bottom-left"));
  push.bottomRight = slate.operation("corner", pushQuarter("bottom-right"));

  return push;
})();

// focus on a window
var focus = (function() {
  var focus = {};

  focus.left   = slate.operation("focus", { "direction" : "left"  });
  focus.right  = slate.operation("focus", { "direction" : "right"  });
  focus.top    = slate.operation("focus", { "direction" : "up"  });
  focus.bottom = slate.operation("focus", { "direction" : "down"  });
  focus.index  = function(index) {
    return function(window) {
      // get all open windows; choose the `index`th one
      var windows = collectWindows();
      if (index < windows.length) { windows[index].focus(); }
    };
  };

  return focus;
}());

// make window full scree
var fullscreen = slate.operation("move", {
  "x"      : "screenOriginX",
  "y"      : "screenOriginY",
  "width"  : "screenSizeX",
  "height" : "screenSizeY"
});

// throw window to another screen
var throw_ = (function(){
  var throw_ = {};

  var throwBuilder = function(incr) {
    return function(window) {
      var currentScreen = window.screen().id();

      // determine which screen this window is in
      var screens = [];
      slate.eachScreen(function(screen) { screens.push(screen.id()); });
      var i = _.indexOf(screens, currentScreen);
      slate.log("Found " + screens.length.toString() + " screens; current is #" + i.toString());

      // move this window to the next one
      var newScreen = screens[ (incr(i) + screens.length) % screens.length ];
      slate.log("New screen #" + newScreen);
      window.doOperation(slate.operation("throw", {"screen": newScreen}));
    }
  };

  throw_.next = throwBuilder(function(x) { return x + 1; });
  throw_.prev = throwBuilder(function(x) { return x - 1; });

  slate.log("Constructed throw_");

  return throw_;
})();

// Collect all windows except with a specified name
var collectWindows = function() {
  var args = configure(arguments[0], {
        "ignore": [],
        "currentScreenOnly": false
      }),
      windows = [];

  slate.eachApp(function(app) {
    if (_.contains(args.ignore, app.name())) return;
    app.eachWindow(function(win) {
      if (!win.isResizable()) return;
      if (!win.isMovable()) return;
      if (args.currentScreenOnly && slate.screen().id() != win.screen().id()) return;
      if (win.isMinimizedOrHidden()) return;
      if (null == win.title() || win.title() === "") return;
      windows.push(win);
    });
  });

  return windows;
};

// layout according to golden spiral on focused screen
var retile = function(windowObject) {
  slate.log("retiling");

  // if no window is in focus, this is null and there's no way to tell which
  // windows to rearrange.
  if (slate.screen().rect() == null) return;

  // collect windows
  slate.log("retrieving windows...");
  var windows = collectWindows({"currentScreenOnly": true});
  slate.log("retrieved " + windows.length.toString() + " windows");

  // decide on window size for non-main windows (40% of right side)
  slate.log("determining window sizes...");
  var ss = slate.screen().rect();
      sizes = golden({
        'xMin' : ss.x,
        'xMax' : ss.x + ss.width,
        'yMin' : ss.y,
        'yMax' : ss.y + ss.height,
        'n'    : windows.length,
        'orientation': 'vertical',
        'count': function(i) { return 2; }
      });
  slate.log("determined sizes for " + sizes.length.toString() + " windows");

  slate.log("moving windows");
  for (var i = 0; i < windows.length; i++) {
    var w = windows[i],
        s = sizes[i];

    w.doOperation("move", {
      "x"      : s.xMin,
      "y"      : s.yMin,
      "width"  : s.xMax - s.xMin,
      "height" : s.yMax - s.yMin
    });
  }
}

///////////////////////////// Key Bindings /////////////////////////////////////

// throw to halves
slate.bind("h:alt;cmd",   push.left);
slate.bind("l:alt;cmd",  push.right);
slate.bind("k:alt;cmd",    push.top);
slate.bind("j:alt;cmd", push.bottom);

// fullscreen
slate.bind("m:alt;cmd", fullscreen);

// throw to corners
slate.bind("1:alt;cmd",     push.topLeft);
slate.bind("2:alt;cmd",    push.topRight);
slate.bind("3:alt;cmd",  push.bottomLeft);
slate.bind("4:alt;cmd", push.bottomRight);

// window selector
// slate.bind("tab:cmd", slate.operation("hint"));

// focus
slate.bind("h:alt;cmd;ctrl",   focus.left);
slate.bind("l:alt;cmd;ctrl",  focus.right);
slate.bind("k:alt;cmd;ctrl",    focus.top);
slate.bind("j:alt;cmd;ctrl", focus.bottom);

// app-specific focus
slate.bind("b:alt;cmd;ctrl", slate.operation("focus", {"app": BROWSER}));
slate.bind("t:alt;cmd;ctrl", slate.operation("focus", {"app": TERMINAL}));
slate.bind("c:alt;cmd;ctrl", slate.operation("focus", {"app": CHAT}));

// golden layout
slate.bind("g:cmd;alt", retile);

// grow/shrink screen
slate.bind("o:alt;cmd", slate.operation("resize", { "width" : "+10%", "height" :  "+0%"  }));
slate.bind("y:alt;cmd", slate.operation("resize", { "width" : "-10%", "height" :  "+0%"  }));
slate.bind("i:alt;cmd", slate.operation("resize", { "width" :  "+0%", "height" : "+10%"  }));
slate.bind("u:alt;cmd", slate.operation("resize", { "width" :  "+0%", "height" : "-10%"  }));

// move to screen
slate.bind("n:alt;cmd", throw_.next);
slate.bind("p:alt;cmd", throw_.prev);
