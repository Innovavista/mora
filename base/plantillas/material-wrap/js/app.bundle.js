"use strict";
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	__webpack_require__(2);
	__webpack_require__(3);
	module.exports = __webpack_require__(4);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	"use strict";
	
	/* globals jQuery */
	(function ($) {
	  'use strict';
	  // Selector to select only not already processed elements
	
	  $.expr[":"].notmdproc = function (obj) {
	    if ($(obj).data("mdproc")) {
	      return false;
	    } else {
	      return true;
	    }
	  };
	
	  function _isChar(evt) {
	    if (typeof evt.which == "undefined") {
	      return true;
	    } else if (typeof evt.which == "number" && evt.which > 0) {
	      return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which != 8 // backspace
	      && evt.which != 9 // tab
	      && evt.which != 13 // enter
	      && evt.which != 16 // shift
	      && evt.which != 17 // ctrl
	      && evt.which != 20 // caps lock
	      && evt.which != 27 // escape
	      ;
	    }
	    return false;
	  }
	
	  function _addFormGroupFocus(element) {
	    var $element = $(element);
	    if (!$element.prop('disabled')) {
	      // this is showing as undefined on chrome but works fine on firefox??
	      $element.closest(".form-group").addClass("is-focused");
	    }
	  }
	
	  function _toggleDisabledState($element, state) {
	    var $target;
	    if ($element.hasClass('checkbox-inline') || $element.hasClass('radio-inline')) {
	      $target = $element;
	    } else {
	      $target = $element.closest('.checkbox').length ? $element.closest('.checkbox') : $element.closest('.radio');
	    }
	    return $target.toggleClass('disabled', state);
	  }
	
	  function _toggleTypeFocus($input) {
	    var disabledToggleType = false;
	    if ($input.is($.material.options.checkboxElements) || $input.is($.material.options.radioElements)) {
	      disabledToggleType = true;
	    }
	    $input.closest('label').hover(function () {
	      var $i = $(this).find('input');
	      var isDisabled = $i.prop('disabled'); // hack because the _addFormGroupFocus() wasn't identifying the property on chrome
	      if (disabledToggleType) {
	        _toggleDisabledState($(this), isDisabled);
	      }
	      if (!isDisabled) {
	        _addFormGroupFocus($i); // need to find the input so we can check disablement
	      }
	    }, function () {
	      _removeFormGroupFocus($(this).find('input'));
	    });
	  }
	
	  function _removeFormGroupFocus(element) {
	    $(element).closest(".form-group").removeClass("is-focused"); // remove class from form-group
	  }
	
	  $.material = {
	    "options": {
	      // These options set what will be started by $.material.init()
	      "validate": true,
	      "input": true,
	      "ripples": true,
	      "checkbox": true,
	      "togglebutton": true,
	      "radio": true,
	      "arrive": true,
	      "autofill": false,
	
	      "withRipples": [".btn:not(.withoutripple)", '.submenu li', '.fc-button', ".dropdown-alt .list-group", "#leftnav .list-group .list-group-item ", ".navbar a:not(.withoutripple)", ".dropdown-menu li a", ".nav-tabs a:not(.withoutripple)", ".withripple", ".pagination li:not(.active):not(.disabled) a:not(.withoutripple)"].join(","),
	      "inputElements": "input.form-control, textarea.form-control, select.form-control",
	      "checkboxElements": ".checkbox > label > input[type=checkbox], label.checkbox-inline > input[type=checkbox]",
	      "togglebuttonElements": ".togglebutton > label > input[type=checkbox]",
	      "radioElements": ".radio > label > input[type=radio], label.radio-inline > input[type=radio]"
	    },
	    "checkbox": function checkbox(selector) {
	      // Add fake-checkbox to material checkboxes
	      var $input = $(selector ? selector : this.options.checkboxElements).filter(":notmdproc").data("mdproc", true).after("<span class='checkbox-material'><span class='check'></span></span>");
	
	      _toggleTypeFocus($input);
	    },
	    "togglebutton": function togglebutton(selector) {
	      // Add fake-checkbox to material checkboxes
	      var $input = $(selector ? selector : this.options.togglebuttonElements).filter(":notmdproc").data("mdproc", true).after("<span class='toggle'></span>");
	
	      _toggleTypeFocus($input);
	    },
	    "radio": function radio(selector) {
	      // Add fake-radio to material radios
	      var $input = $(selector ? selector : this.options.radioElements).filter(":notmdproc").data("mdproc", true).after("<span class='circle'></span><span class='check'></span>");
	
	      _toggleTypeFocus($input);
	    },
	    "input": function input(selector) {
	      $(selector ? selector : this.options.inputElements).filter(":notmdproc").data("mdproc", true).each(function () {
	        var $input = $(this);
	
	        // Requires form-group standard markup (will add it if necessary)
	        var $formGroup = $input.closest(".form-group"); // note that form-group may be grandparent in the case of an input-group
	        if ($formGroup.length === 0 && $input.attr('type') !== "hidden" && !$input.attr('hidden')) {
	          $input.wrap("<div class='form-group'></div>");
	          $formGroup = $input.closest(".form-group"); // find node after attached (otherwise additional attachments don't work)
	        }
	
	        // Legacy - Add hint label if using the old shorthand data-hint attribute on the input
	        if ($input.attr("data-hint")) {
	          $input.after("<p class='help-block'>" + $input.attr("data-hint") + "</p>");
	          $input.removeAttr("data-hint");
	        }
	
	        // Legacy - Change input-sm/lg to form-group-sm/lg instead (preferred standard and simpler css/less variants)
	        var legacySizes = {
	          "input-lg": "form-group-lg",
	          "input-sm": "form-group-sm"
	        };
	        $.each(legacySizes, function (legacySize, standardSize) {
	          if ($input.hasClass(legacySize)) {
	            $input.removeClass(legacySize);
	            $formGroup.addClass(standardSize);
	          }
	        });
	
	        // Legacy - Add label-floating if using old shorthand <input class="floating-label" placeholder="foo">
	        if ($input.hasClass("floating-label")) {
	          var placeholder = $input.attr("placeholder");
	          $input.attr("placeholder", null).removeClass("floating-label");
	          var id = $input.attr("id");
	          var forAttribute = "";
	          if (id) {
	            forAttribute = "for='" + id + "'";
	          }
	          $formGroup.addClass("label-floating");
	          $input.after("<label " + forAttribute + "class='control-label'>" + placeholder + "</label>");
	        }
	
	        // Set as empty if is empty (damn I must improve this...)
	        if ($input.val() === null || $input.val() == "undefined" || $input.val() === "") {
	          $formGroup.addClass("is-empty");
	        }
	
	        // Support for file input
	        if ($formGroup.find("input[type=file]").length > 0) {
	          $formGroup.addClass("is-fileinput");
	        }
	      });
	    },
	    "attachInputEventHandlers": function attachInputEventHandlers() {
	      var validate = this.options.validate;
	
	      $(document).on("keydown paste", ".form-control", function (e) {
	        if (_isChar(e)) {
	          $(this).closest(".form-group").removeClass("is-empty");
	        }
	      }).on("keyup change", ".form-control", function () {
	        var $input = $(this);
	        var $formGroup = $input.closest(".form-group");
	        var isValid = typeof $input[0].checkValidity === "undefined" || $input[0].checkValidity();
	
	        if ($input.val() === "") {
	          $formGroup.addClass("is-empty");
	        } else {
	          $formGroup.removeClass("is-empty");
	        }
	
	        // Validation events do not bubble, so they must be attached directly to the input: http://jsfiddle.net/PEpRM/1/
	        //  Further, even the bind method is being caught, but since we are already calling #checkValidity here, just alter
	        //  the form-group on change.
	        //
	        // NOTE: I'm not sure we should be intervening regarding validation, this seems better as a README and snippet of code.
	        //        BUT, I've left it here for backwards compatibility.
	        if (validate) {
	          if (isValid) {
	            $formGroup.removeClass("has-error");
	          } else {
	            $formGroup.addClass("has-error");
	          }
	        }
	      }).on("focus", ".form-control, .form-group.is-fileinput", function () {
	        _addFormGroupFocus(this);
	      }).on("blur", ".form-control, .form-group.is-fileinput", function () {
	        _removeFormGroupFocus(this);
	      }
	      // make sure empty is added back when there is a programmatic value change.
	      //  NOTE: programmatic changing of value using $.val() must trigger the change event i.e. $.val('x').trigger('change')
	      ).on("change", ".form-group input", function () {
	        var $input = $(this);
	        if ($input.attr("type") == "file") {
	          return;
	        }
	
	        var $formGroup = $input.closest(".form-group");
	        var value = $input.val();
	        if (value) {
	          $formGroup.removeClass("is-empty");
	        } else {
	          $formGroup.addClass("is-empty");
	        }
	      }
	      // set the fileinput readonly field with the name of the file
	      ).on("change", ".form-group.is-fileinput input[type='file']", function () {
	        var $input = $(this);
	        var $formGroup = $input.closest(".form-group");
	        var value = "";
	        $.each(this.files, function (i, file) {
	          value += file.name + ", ";
	        });
	        value = value.substring(0, value.length - 2);
	        if (value) {
	          $formGroup.removeClass("is-empty");
	        } else {
	          $formGroup.addClass("is-empty");
	        }
	        $formGroup.find("input.form-control[readonly]").val(value);
	      });
	    },
	    "ripples": function ripples(selector) {
	      $(selector ? selector : this.options.withRipples).ripples();
	    },
	    "autofill": function autofill() {
	      // This part of code will detect autofill when the page is loading (username and password inputs for example)
	      var loading = setInterval(function () {
	        $("input[type!=checkbox]").each(function () {
	          var $this = $(this);
	          if ($this.val() && $this.val() !== $this.attr("value")) {
	            $this.trigger("change");
	          }
	        });
	      }, 100);
	
	      // After 10 seconds we are quite sure all the needed inputs are autofilled then we can stop checking them
	      setTimeout(function () {
	        clearInterval(loading);
	      }, 10000);
	    },
	    "attachAutofillEventHandlers": function attachAutofillEventHandlers() {
	      // Listen on inputs of the focused form (because user can select from the autofill dropdown only when the input has focus)
	      var focused;
	      $(document).on("focus", "input", function () {
	        var $inputs = $(this).parents("form").find("input").not("[type=file]");
	        focused = setInterval(function () {
	          $inputs.each(function () {
	            var $this = $(this);
	            if ($this.val() !== $this.attr("value")) {
	              $this.trigger("change");
	            }
	          });
	        }, 100);
	      }).on("blur", ".form-group input", function () {
	        clearInterval(focused);
	      });
	    },
	    "init": function init(options) {
	      this.options = $.extend({}, this.options, options);
	      var $document = $(document);
	
	      if ($.fn.ripples && this.options.ripples) {
	        this.ripples();
	      }
	      if (this.options.input) {
	        this.input();
	        this.attachInputEventHandlers();
	      }
	      if (this.options.checkbox) {
	        this.checkbox();
	      }
	      if (this.options.togglebutton) {
	        this.togglebutton();
	      }
	      if (this.options.radio) {
	        this.radio();
	      }
	      if (this.options.autofill) {
	        this.autofill();
	        this.attachAutofillEventHandlers();
	      }
	
	      if (document.arrive && this.options.arrive) {
	        if ($.fn.ripples && this.options.ripples) {
	          $document.arrive(this.options.withRipples, function () {
	            $.material.ripples($(this));
	          });
	        }
	        if (this.options.input) {
	          $document.arrive(this.options.inputElements, function () {
	            $.material.input($(this));
	          });
	        }
	        if (this.options.checkbox) {
	          $document.arrive(this.options.checkboxElements, function () {
	            $.material.checkbox($(this));
	          });
	        }
	        if (this.options.radio) {
	          $document.arrive(this.options.radioElements, function () {
	            $.material.radio($(this));
	          });
	        }
	        if (this.options.togglebutton) {
	          $document.arrive(this.options.togglebuttonElements, function () {
	            $.material.togglebutton($(this));
	          });
	        }
	      }
	    }
	  };
	})(jQuery);

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	"use strict";
	
	!function (a, b, c, d) {
	  "use strict";
	  function e(b, c) {
	    g = this, this.element = a(b), this.options = a.extend({}, h, c), this._defaults = h, this._name = f, this.init();
	  }var f = "ripples",
	      g = null,
	      h = {};e.prototype.init = function () {
	    var c = this.element;c.on("mousedown touchstart", function (d) {
	      if (!g.isTouch() || "mousedown" !== d.type) {
	        c.find(".ripple-container").length || c.append('<div class="ripple-container"></div>');var e = c.children(".ripple-container"),
	            f = g.getRelY(e, d),
	            h = g.getRelX(e, d);if (f || h) {
	          var i = g.getRipplesColor(c),
	              j = a("<div></div>");j.addClass("ripple").css({ left: h, top: f, "background-color": i }), e.append(j), function () {
	            return b.getComputedStyle(j[0]).opacity;
	          }(), g.rippleOn(c, j), setTimeout(function () {
	            g.rippleEnd(j);
	          }, 500), c.on("mouseup mouseleave touchend", function () {
	            j.data("mousedown", "off"), "off" === j.data("animating") && g.rippleOut(j);
	          });
	        }
	      }
	    });
	  }, e.prototype.getNewSize = function (a, b) {
	    return Math.max(a.outerWidth(), a.outerHeight()) / b.outerWidth() * 2.5;
	  }, e.prototype.getRelX = function (a, b) {
	    var c = a.offset();return g.isTouch() ? (b = b.originalEvent, 1 === b.touches.length ? b.touches[0].pageX - c.left : !1) : b.pageX - c.left;
	  }, e.prototype.getRelY = function (a, b) {
	    var c = a.offset();return g.isTouch() ? (b = b.originalEvent, 1 === b.touches.length ? b.touches[0].pageY - c.top : !1) : b.pageY - c.top;
	  }, e.prototype.getRipplesColor = function (a) {
	    var c = a.data("ripple-color") ? a.data("ripple-color") : b.getComputedStyle(a[0]).color;return c;
	  }, e.prototype.hasTransitionSupport = function () {
	    var a = c.body || c.documentElement,
	        b = a.style,
	        e = b.transition !== d || b.WebkitTransition !== d || b.MozTransition !== d || b.MsTransition !== d || b.OTransition !== d;return e;
	  }, e.prototype.isTouch = function () {
	    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	    );
	  }, e.prototype.rippleEnd = function (a) {
	    a.data("animating", "off"), "off" === a.data("mousedown") && g.rippleOut(a);
	  }, e.prototype.rippleOut = function (a) {
	    a.off(), g.hasTransitionSupport() ? a.addClass("ripple-out") : a.animate({ opacity: 0 }, 100, function () {
	      a.trigger("transitionend");
	    }), a.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () {
	      a.remove();
	    });
	  }, e.prototype.rippleOn = function (a, b) {
	    var c = g.getNewSize(a, b);g.hasTransitionSupport() ? b.css({ "-ms-transform": "scale(" + c + ")", "-moz-transform": "scale(" + c + ")", "-webkit-transform": "scale(" + c + ")", transform: "scale(" + c + ")" }).addClass("ripple-on").data("animating", "on").data("mousedown", "on") : b.animate({ width: 2 * Math.max(a.outerWidth(), a.outerHeight()), height: 2 * Math.max(a.outerWidth(), a.outerHeight()), "margin-left": -1 * Math.max(a.outerWidth(), a.outerHeight()), "margin-top": -1 * Math.max(a.outerWidth(), a.outerHeight()), opacity: .2 }, 500, function () {
	      b.trigger("transitionend");
	    });
	  }, a.fn.ripples = function (b) {
	    return this.each(function () {
	      a.data(this, "plugin_" + f) || a.data(this, "plugin_" + f, new e(this, b));
	    });
	  };
	}(jQuery, window, document);
	//# sourceMappingURL=ripples.min.js.map

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	'use strict';
	
	// GLOBAL CONSTANTS
	// -----------------------------------
	(function (window, document, $, undefined) {
	  "use strict";
	
	  var MaterialWrap = window.MaterialWrap || (window.MaterialWrap = {});
	  if (Modernizr.touchevents) {
	    MaterialWrap.APP_TOUCH = true;
	  } else {
	    MaterialWrap.APP_TOUCH = false;
	  }
	  MaterialWrap.APP_MEDIAQUERY = {
	    'desktopLG': 1280,
	    'desktop': 992,
	    'tablet': 768,
	    'mobile': 480
	  };
	  MaterialWrap.APP_COLORS = {
	    'primary': '#ec407a',
	    'success': '#28bebd',
	    'info': '#42a5f5',
	    'warning': '#fdf39e',
	    'danger': '#ef5350',
	    'mw_purple': '#6B79C4',
	    'mw_turquoise': '#00c5dc',
	    'mw_peach': '#feb38d',
	    'mw_salmon': '#EE6E73',
	    'mw_lightGray': '#EEF5F9',
	    'mw_gray': '#8f9eb5',
	    'mw_darkGray': '#707C94',
	    'mw_grayBlue': '#59779B'
	  };
	})(window, document, window.jQuery);
	// Initialize App configurations
	// --------------------------------------------------
	(function (window, document, $, undefined) {
	  //Option to persist settings:
	  var persistSettings = true;
	  var $html = $('html'),
	      $body = $('body'),
	      $appWrapper = $('#app_wrapper'),
	      $sidebarLeft = $('#app_sidebar-left'),
	      $sidebarRight = $('#app_sidebar-right');
	  if (persistSettings) {
	    //Setup some default layout options on app start.
	    //Let's check if localStorage is available and persist our settings,
	    if (typeof localStorage !== 'undefined') {
	      //Global namespace for sessionStorage,localStorage, and cookieStorage
	      window.appConfig = Storages.initNamespaceStorage('appConfig');
	      // If no appConfig key exsist then setup our default settings
	      if (appConfig.localStorage.isEmpty()) {
	        appConfig.localStorage.set({ 'leftSideBar': '', 'contentExpand': '' });
	      };
	      $body.addClass(appConfig.localStorage.get('leftSideBar'));
	      $appWrapper.addClass(appConfig.localStorage.get('contentExpand'));
	    };
	  };
	  window.app = {
	    persist: persistSettings,
	    config: {
	      isTouch: function isTouch() {
	        return $html.hasClass('touch');
	      },
	      isLeftSideBarCollapsed: function isLeftSideBarCollapsed() {
	        return $body.hasClass('app_sidebar-menu-collapsed');
	      },
	      isContentExpand: function isContentExpand() {
	        return $appWrapper.hasClass('content-expanded');
	      }
	    }
	  };
	})(window, document, window.jQuery);

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var _appState = __webpack_require__(5);
	
	var _drawers = __webpack_require__(8);
	
	var _search = __webpack_require__(9);
	
	var _cards = __webpack_require__(10);
	
	var _demo = __webpack_require__(12);
	
	var _sidebars = __webpack_require__(6);
	
	var _initPlugins = __webpack_require__(13);
	
	var MaterialWrap = window.MaterialWrap || (window.MaterialWrap = {}); /*
	                                                                      *
	                                                                      * MaterialWrap
	                                                                      * Author: http://authenticgoods.co
	                                                                      *
	                                                                      */
	//import the JavaScript modules to run
	
	
	(function (window) {
	  if (window.Package) {
	    Materialize = {};
	  } else {
	    window.Materialize = {};
	  }
	})(window);
	// Unique ID
	Materialize.guid = function () {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	  }
	  return function () {
	    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	  };
	}();
	$(function () {
	  $.material.init();
	  (0, _initPlugins.scrollBar)();
	  (0, _sidebars.initSubMenu)();
	  (0, _appState.toggleState)();
	  (0, _appState.toggleExpand)();
	  (0, _search.navBarSearch)();
	  (0, _cards.cardRefresh)();
	  (0, _cards.cardToggleHighlighter)();
	  (0, _sidebars.switchMenuState)();
	  (0, _sidebars.openProfileMenu)();
	  (0, _sidebars.openThemeSettingPanel)();
	  (0, _cards.cardOffCanvas)();
	  (0, _drawers.toggleDrawer)();
	  (0, _cards.cardCollapse)();
	  (0, _sidebars.closeOpenState)();
	  (0, _initPlugins.otherScrollbarOptions)();
	  (0, _cards.cardSearch)();
	  (0, _cards.cardReveal)();
	  (0, _cards.cardTask)();
	  (0, _demo.loadThemes)();
	  (0, _demo.swapLayoutMode)();
	});

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.toggleExpand = exports.toggleState = undefined;
	
	var _sidebars = __webpack_require__(6);
	
	var _backdrops = __webpack_require__(7);
	
	//
	// Module to toggle state
	// ----------------------------------
	var toggleState = function toggleState() {
	    var $toggleElement = $('[data-toggle-state]');
	    $('[data-toggle-state]').on('click', function (e) {
	        e.stopPropagation();
	        var $body = $('body'),
	            element = $(this),
	            className = element.data('toggleState'),
	            key = element.data('key'),
	            $target = $body;
	        if (className) {
	            if ($target.hasClass(className)) {
	                $target.removeClass(className);
	                if (typeof localStorage !== 'undefined' && window.app.persist && Modernizr.mq('(min-width: 1280px)')) {
	                    appConfig.localStorage.set(key, '');
	                };
	            } else {
	                $target.addClass(className);
	                if (typeof localStorage !== 'undefined' && window.app.persist && Modernizr.mq('(min-width: 1280px)')) {
	                    appConfig.localStorage.set(key, className);
	                };
	            }
	        }
	        (0, _sidebars.menuIconState)(element);
	        if (typeof localStorage !== 'undefined' && window.app.persist && Modernizr.mq('(max-width: 1280px)') || typeof localStorage !== 'undefined' && window.app.persist && className === 'sidebar-overlay-open') {
	            (0, _backdrops.backDrops)(className, element, $target);
	            appConfig.localStorage.set(key, '');
	        }
	    });
	};
	var toggleExpand = function toggleExpand() {
	    var $toggleExpanded = $('[data-toggle-expand]');
	    $toggleExpanded.on('click', function (e) {
	        e.stopPropagation();
	        var $appWrapper = $('#app_wrapper'),
	            element = $(this),
	            elementIcon = element.children('i'),
	            className = element.data('toggleExpand'),
	            key = element.data('key'),
	            $target = $appWrapper;
	        if (className) {
	            if ($target.hasClass(className)) {
	                $target.removeClass(className);
	                if (typeof localStorage !== 'undefined' && window.app.persist) {
	                    appConfig.localStorage.set(key, '');
	                    elementIcon.toggleClass('zmdi-fullscreen-exit zmdi-fullscreen');
	                };
	            } else {
	                $target.addClass(className);
	                if (typeof localStorage !== 'undefined' && window.app.persist) {
	                    appConfig.localStorage.set(key, className);
	                    elementIcon.toggleClass('zmdi-fullscreen zmdi-fullscreen-exit');
	                };
	            }
	        }
	    });
	};
	exports.toggleState = toggleState;
	exports.toggleExpand = toggleExpand;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var initSubMenu = function initSubMenu() {
	  var subMenu = $('#app_main-menu-wrapper .nav');
	  $(subMenu).navgoco({ caretHtml: false, accordion: true });
	};
	var closeOpenState = function closeOpenState() {
	  $('#app_sidebar-left').on('mouseleave', function () {
	    if ($('body.app_sidebar-menu-collapsed').length > 0) {
	      $('.nav-dropdown').each(function () {
	        if ($(this).hasClass('open') && !$(this).hasClass('active')) {
	          $(this).removeClass('open');
	          $(this).children('.nav-sub').removeAttr("style");
	        }
	      });
	    }
	  });
	};
	var switchMenuState = function switchMenuState() {
	  var $body = $('body');
	  var $html = $('html');
	  if ($(window).width() < 992 && !$html.hasClass('backdrop-open')) {
	    $body.removeClass('app_sidebar-menu-collapsed');
	    $('#content_wrapper').removeClass('toggle-left toggle-right');
	  } else if (!$html.hasClass('backdrop-open')) {
	    $body.removeClass('app_sidebar-left-open');
	  }
	};
	var menuIconState = function menuIconState(element) {
	  //Left Menu
	  if (element.context.dataset.toggleState === 'app_sidebar-menu-collapsed') {
	    if ($('body.app_sidebar-menu-collapsed').length > 0) {
	      $('#logo_wrapper .menu-icon a').addClass('is-active');
	    } else {
	      $('#logo_wrapper .menu-icon a').removeClass('is-active');
	    };
	  };
	  //Right Menu
	  if (element.context.dataset.toggleState === 'sidebar-overlay-open') {
	    if ($('body.sidebar-overlay-open').length > 0) {
	      $('[data-toggle-state="sidebar-overlay-open"] i').toggleClass('mdi-playlist-plus mdi-playlist-minus');
	    } else {
	      $('[data-toggle-state="sidebar-overlay-open"] i').toggleClass('mdi-playlist-minus mdi-playlist-plus');
	    };
	  }
	};
	var openProfileMenu = function openProfileMenu() {
	  $('[data-profile="open-menu"]').on('click', function () {
	    $(this).parents('.profile-menu').toggleClass('open').find('.accounts').slideToggle();
	    $('.switch').materialAvatar({ shape: 'circle' });
	  });
	};
	var openThemeSettingPanel = function openThemeSettingPanel() {
	  $('[data-trigger="sidebar-overlay-open"]').on('click', function (e) {
	    e.stopPropagation();
	    $('[data-toggle-state="sidebar-overlay-open"]').trigger('click');
	    $('a[href="#sidebar_settings"]').trigger('click');
	  });
	};
	exports.initSubMenu = initSubMenu;
	exports.closeOpenState = closeOpenState;
	exports.switchMenuState = switchMenuState;
	exports.menuIconState = menuIconState;
	exports.openProfileMenu = openProfileMenu;
	exports.openThemeSettingPanel = openThemeSettingPanel;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var backDrops = exports.backDrops = function backDrops(className, element, $target) {
	  var $body = $('body');
	  var $html = $('html');
	  if ($target.hasClass(className)) {
	    if (className === 'expand' || className === 'app_sidebar-left-open') {
	      $body.append('<div class="backdrop ' + className + ' top"></div>');
	    } else {
	      $body.append('<div class="backdrop ' + className + '"></div>');
	    }
	    if (MaterialWrap.APP_TOUCH === true) {
	      $('.' + className + '.backdrop').hammer().bind('tap', function (e) {
	        e.stopPropagation();
	        element.trigger('click');
	      });
	    } else {
	      $('.' + className + '.backdrop').on('click', function (e) {
	        e.stopPropagation();
	        element.trigger('click');
	      });
	    };
	    if ($('.backdrop').length > 0 && !$html.hasClass('backdrop-open')) {
	      $html.addClass('backdrop-open');
	    }
	  } else {
	    if (className === 'sidebar-overlay-open') {
	      $('#chat_compose_wrapper').removeClass('open');
	    }
	    $('.' + className + '.backdrop').fadeOut(250, function () {
	      $(this).remove();
	      if ($('.backdrop').length === 0) {
	        $html.removeClass('backdrop-open');
	      }
	    });
	  }
	};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.toggleDrawer = undefined;
	
	var _backdrops = __webpack_require__(7);
	
	var toggleDrawer = function toggleDrawer() {
	  var $toggleElement = $('[data-drawer]');
	  $toggleElement.off('click');
	  $toggleElement.on('click', function (e) {
	    e.stopPropagation();
	    var $body = $('body'),
	        element = $(this),
	        className = element.data('drawer'),
	        $target = $('#content_wrapper');
	    if (className) {
	      if ($target.hasClass(className)) {
	        $target.removeClass(className);
	      } else {
	        $target.addClass(className);
	      }
	    }
	    if (className === 'open-left' || className === 'open-right' || className === 'open-left-lg' || className === 'open-right-lg') {
	      (0, _backdrops.backDrops)(className, element, $target);
	    } else if (className === 'toggle-left' && Modernizr.mq('(max-width: 992px)') || className === 'toggle-right' && Modernizr.mq('(max-width: 992px)')) {
	      (0, _backdrops.backDrops)(className, element, $target);
	    }
	    setTimeout(function () {
	      if ($('#storeLocations').length > 0) {
	        var storeLocations = window.storeLocations || (window.storeLocations = {});
	        google.maps.event.trigger(storeLocations, 'resize');
	      }
	    }, 200);
	  });
	  var $dismissElement = $('[data-dismiss=drawer]');
	  $dismissElement.on('click', function (e) {
	    e.stopPropagation();
	    $('.backdrop').trigger('click');
	  });
	}; //
	// Module to toggle drawers
	// ----------------------------------
	exports.toggleDrawer = toggleDrawer;

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var navBarSearch = function navBarSearch() {
	    var $openSearch = $('[data-navsearch-open]'),
	        $closeSearch = $('[data-navsearch-close]'),
	        $navbarForm = $('#navbar_form'),
	        $navbarSearch = $('#navbar_search'),
	        $document = $(document);
	    $openSearch.on('click', function (e) {
	        e.stopPropagation();
	        $navbarForm.addClass('open');
	        $navbarSearch.focus();
	    });
	    $closeSearch.on('click', function (e) {
	        e.stopPropagation();
	        $navbarForm.removeClass('open');
	        $navbarSearch.val('');
	    });
	    $document.on('click', function (e) {
	        e.stopPropagation();
	        if (e.target !== $('#navbar_search')) {
	            $navbarForm.removeClass('open');
	            $navbarSearch.val('');
	        }
	    });
	    $navbarSearch.on('click', function (e) {
	        e.stopPropagation();
	    });
	};
	var widgetSearch = function widgetSearch() {
	    var $openSearch = $('[data-widget-search-open]'),
	        $closeSearch = $('[data-widget-search-close]');
	    $openSearch.on('click', function (e) {
	        e.stopPropagation();
	        $navbarForm.addClass('open');
	        $navbarSearch.focus();
	    });
	};
	exports.navBarSearch = navBarSearch;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.cardReveal = exports.cardSearch = exports.cardToggleHighlighter = exports.cardTask = exports.cardStacks = exports.cardOffCanvas = exports.cardCollapse = exports.cardRefresh = undefined;
	
	var _dashboardCharts = __webpack_require__(11);
	
	//
	// Module for cards
	// ----------------------------------
	var card = {
	  cardClass: ".card",
	  cardHeadingClass: ".card .card-heading",
	  cardBodyClass: ".card .card-body",
	  cardFooterClass: ".card .card-footer",
	  cardRevealClass: ".card .card-reveal",
	  cardRefresh: '.card a[data-toggle="refresh"]',
	  cardClose: '.card a[data-toggle="close"]',
	  cardCollapse: '.card a[data-toggle="collapse"]',
	  cardToggleHighlighter: 'a[data-toggle-view="code"]',
	  cardSearchOpen: 'a[data-card-search="open"]',
	  cardSearchClose: '[data-card-search="close"]',
	  cardRevealToggle: '[data-toggle="reveal"]'
	};
	var cardRefresh = function cardRefresh() {
	  $(document).on("click", card.cardRefresh, function (e) {
	    e.preventDefault();
	    var $card = $(this).closest(card.cardClass);
	    $card.append("<div class=\"load\"></div>");
	    var $loader = $card.find('.load');
	    $loader.load('assets/partials/_preloader.html', function () {
	      setTimeout(function () {
	        $loader.fadeOut('1500', function () {
	          $loader.remove();
	        });
	      }, 1700);
	    });
	  });
	};
	// Card collapse
	var cardCollapse = function cardCollapse() {
	  $(document).on("click", card.cardCollapse, function (e) {
	    e.preventDefault();
	    $(this).children('i').toggleClass('zmdi-chevron-up zmdi-chevron-down');
	    var $cardBody = $(this).closest(".card").children('.card-body');
	    $cardBody.slideToggle();
	  });
	};
	// Toggle Syntax Highlighter
	var cardToggleHighlighter = function cardToggleHighlighter() {
	  $(document).on("click", card.cardToggleHighlighter, function (e) {
	    e.preventDefault();
	    var $cardContianer = $(this).closest(".card").find('.syntax-highlighter');
	    $cardContianer.slideToggle();
	  });
	};
	// Menu off-canvas
	var cardOffCanvas = function cardOffCanvas() {
	  $('[data-card-off-canvas]').on('click', function () {
	    var $this = $(this),
	        cardClass = $this.data('card-off-canvas');
	    $this.toggleClass(cardClass);
	    $this.closest('.card').find('.card-body').toggleClass(cardClass);
	    $this.parents('.card').find('.card-off-canvas').toggleClass(cardClass);
	    if ($('.card-off-canvas.is-active').length > 0) {
	      $this.closest('.card.drawer ').prepend('<div class="card-backdrop"></div>');
	    } else {
	      $this.parents('.drawer').find('.card-backdrop').remove();
	    }
	  });
	  $(document.body).on('click', '.card .card-backdrop', function () {
	    $('[data-card-off-canvas]').trigger('click');
	  });
	};
	// Card stacks
	var cardStacks = function cardStacks() {
	  $(".card-stack-wrapper > li").on("click", function (e) {
	    e.preventDefault();
	    var a = $(this).parents(".card-stack-wrapper");
	    $(this).appendTo(a);
	    if (a.is('#chartistBarsDashboard')) {
	      setTimeout(function () {
	        (0, _dashboardCharts.chartistBarsDashboard)();
	      }, 200);
	    } else if (a.is('#chartistLineDashboard')) {
	      setTimeout(function () {
	        (0, _dashboardCharts.chartistLineDashboard)();
	      }, 200);
	    } else if (a.is('#chartistBiPolarChartDashboard')) {
	      setTimeout(function () {
	        (0, _dashboardCharts.chartistBiPolarChartDashboard)();
	      }, 200);
	    } else if (a.is('#chartistPathAnimationDashboard')) {
	      setTimeout(function () {
	        (0, _dashboardCharts.chartistPathAnimationDashboard)();
	      }, 200);
	    }
	  });
	};
	// Card task
	var cardTask = function cardTask() {
	  $('[data-toggle="input"]').on('click', function () {
	    $(this).toggleClass('open');
	    var $taskForm = $(this).parents('.card-task').find('form');
	    $taskForm.toggleClass('open');
	    $taskForm.find('input').focus();
	  });
	  if ($('.checklist input[type=checkbox]').length > 0) {
	    var i = 1,
	        $taskList = $('.checklist input[type=checkbox]');
	    $taskList.each(function (i) {
	      $(this).attr('id', 'task_' + i);
	    });
	    $taskList.change(function () {
	      if (this.checked) {
	        $(this).closest('label').css({
	          'text-decoration': 'line-through'
	        });
	      } else {
	        $(this).closest('label').css({
	          'text-decoration': 'none'
	        });
	      }
	    });
	  };
	};
	// Card Search
	var cardSearch = function cardSearch() {
	  $(document).on("click", card.cardSearchOpen, function (e) {
	    e.preventDefault();
	    var $this = $(this),
	        $card = $this.closest(card.cardClass),
	        $cardSearch = $card.find('.card-search'),
	        cardClass = $this.data('cardSearch');
	    $cardSearch.addClass(cardClass);
	    $cardSearch.find('.form-control').focus();
	  });
	  $(document).on("click", card.cardSearchClose, function (e) {
	    e.preventDefault();
	    var $this = $(this),
	        $card = $this.closest('.card'),
	        $cardSearch = $card.find('.card-search'),
	        cardClass = $this.data('cardSearch');
	    $cardSearch.removeClass('open');
	    $cardSearch.find('.form-control').val('');
	    if ($card.hasClass('card-data-tables')) {
	      var oTable = $('.dataTable').DataTable();
	      oTable.search($(this).val()).draw();
	    }
	  });
	};
	// Toggle Card Reveal
	var cardReveal = function cardReveal() {
	  $(document).on("click", card.cardRevealToggle, function (e) {
	    e.preventDefault();
	    var $cardRevealContianer = $(this).closest(".card.reveal");
	    $cardRevealContianer.toggleClass('open');
	    $('.email-form input,.email-form textarea').val('');
	    if ($cardRevealContianer.hasClass('open')) {
	      setTimeout(function () {
	        $('#email-to').focus();
	      }, 100);
	    }
	  });
	};
	exports.cardRefresh = cardRefresh;
	exports.cardCollapse = cardCollapse;
	exports.cardOffCanvas = cardOffCanvas;
	exports.cardStacks = cardStacks;
	exports.cardTask = cardTask;
	exports.cardToggleHighlighter = cardToggleHighlighter;
	exports.cardSearch = cardSearch;
	exports.cardReveal = cardReveal;

/***/ }),
/* 11 */
/***/ (function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	/*
	 * Chart Demos for the dashboard views
	 */
	var createGraph = function createGraph(selector, data1, data2, labels, colors, borderColor, bgColor) {
	    $("<div id='tooltip'></div>").css({
	        position: "absolute",
	        display: "none",
	        border: "1px solid #fdd",
	        padding: "2px",
	        "background-color": "#fee",
	        opacity: 0.80
	    }).appendTo("body");
	    $.plot($(selector), [{
	        data: data1,
	        label: labels[0],
	        color: colors[0]
	    }, {
	        data: data2,
	        label: labels[1],
	        color: colors[1]
	    }], {
	        series: {
	            lines: {
	                show: true,
	                fill: true,
	                lineWidth: 1,
	                fillColor: {
	                    colors: [{
	                        opacity: 0.2
	                    }, {
	                        opacity: 0.9
	                    }]
	                }
	            },
	            points: {
	                show: true
	            },
	            shadowSize: 0
	        },
	        legend: {
	            position: 'nw'
	        },
	        grid: {
	            hoverable: true,
	            clickable: true,
	            borderColor: '#fff',
	            borderWidth: 0,
	            labelMargin: 10,
	            backgroundColor: '#fff'
	        },
	        yaxis: {
	            min: 0,
	            max: 15,
	            color: 'rgba(0,0,0,0)'
	        },
	        xaxis: {
	            color: 'rgba(0,0,0,0)'
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: '%s: Value of %x is %y',
	            shifts: {
	                x: -60,
	                y: 25
	            },
	            defaultTheme: false
	        }
	    });
	};
	var dashboardWebStats = function dashboardWebStats() {
	    var uploads = [];
	    for (var i = 0; i <= 10; i += 1) {
	        uploads.push([i, Math.random() * 13]);
	    }
	    var downloads = [];
	    for (var i = 0; i <= 10; i += 1) {
	        downloads.push([i, Math.random() * 13]);
	    }
	    var plabels = ["Referral", "Direct"];
	    var pcolors = ['#28bebd', '#1C86BF'];
	    var borderColor = '#fff';
	    var bgColor = '#fff';
	    if ($('#website-stats').length > 0) {
	        createGraph("#website-stats", uploads, downloads, plabels, pcolors, borderColor, bgColor);
	    }
	};
	//
	// Sparkline demo
	//
	var sparklineDashboard = function sparklineDashboard() {
	    $('#sparkline1').sparkline([5, 7, 4, 8, 6, 9, 4, 7, 6, 5, 9, 5], {
	        type: 'bar',
	        height: '100',
	        barWidth: '10',
	        resize: true,
	        barSpacing: '5',
	        barColor: '#28bebd'
	    });
	    $('#sparkline2').sparkline([6, 4, 5, 3, 8, 5, 6, 4, 8, 6, 9, 5], {
	        type: 'bar',
	        height: '100',
	        barWidth: '10',
	        resize: true,
	        barSpacing: '5',
	        barColor: '#1c86bf'
	    });
	    $('#sparkline3').sparkline([4, 3, 6, 2, 7, 4, 8, 4, 9, 4, 6, 3], {
	        type: 'bar',
	        height: '100',
	        barWidth: '10',
	        resize: true,
	        barSpacing: '5',
	        barColor: '#5867c3'
	    });
	    $('#sparkline4').sparkline([4, 6, 4, 8, 5, 1, 5, 9, 5, 3, 5, 6], {
	        type: 'bar',
	        height: '100',
	        barWidth: '10',
	        resize: true,
	        barSpacing: '5',
	        barColor: '#fcc04d'
	    });
	};
	//
	// Chartist
	//
	var chartistPathAnimationDashboard = function chartistPathAnimationDashboard() {
	    if ($('#ct-PathAnimation1 ').length > 0) {
	        var chart = new Chartist.Line('#ct-PathAnimation1 .ct-chart', {
	            labels: ['Jan', 'Feb', 'March '],
	            series: [[1, 5, 2], [2, 3, 4], [5, 4, 3]]
	        }, {
	            low: 0,
	            showArea: true,
	            showPoint: false,
	            fullWidth: true
	        });
	        chart.on('draw', function (data) {
	            if (data.type === 'line' || data.type === 'area') {
	                data.element.animate({
	                    d: {
	                        begin: 2000 * data.index,
	                        dur: 2000,
	                        from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
	                        to: data.path.clone().stringify(),
	                        easing: Chartist.Svg.Easing.easeOutQuint
	                    }
	                });
	            }
	        });
	    }
	    if ($('#ct-PathAnimation2 ').length > 0) {
	        var chart = new Chartist.Line('#ct-PathAnimation2 .ct-chart', {
	            labels: ['April', 'May', 'June'],
	            series: [[3, 2, 2], [2, 3, 4], [1, 4, 0.5]]
	        }, {
	            low: 0,
	            showArea: true,
	            showPoint: false,
	            fullWidth: true
	        });
	        chart.on('draw', function (data) {
	            if (data.type === 'line' || data.type === 'area') {
	                data.element.animate({
	                    d: {
	                        begin: 2000 * data.index,
	                        dur: 2000,
	                        from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
	                        to: data.path.clone().stringify(),
	                        easing: Chartist.Svg.Easing.easeOutQuint
	                    }
	                });
	            }
	        });
	    }
	    if ($('#ct-PathAnimation3 ').length > 0) {
	        var chart = new Chartist.Line('#ct-PathAnimation3 .ct-chart', {
	            labels: ['July', 'Aug', 'Sept'],
	            series: [[2, 4, 3], [1, 5, 0.5], [2, 3, 2]]
	        }, {
	            low: 0,
	            showArea: true,
	            showPoint: false,
	            fullWidth: true
	        });
	        chart.on('draw', function (data) {
	            if (data.type === 'line' || data.type === 'area') {
	                data.element.animate({
	                    d: {
	                        begin: 2000 * data.index,
	                        dur: 2000,
	                        from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
	                        to: data.path.clone().stringify(),
	                        easing: Chartist.Svg.Easing.easeOutQuint
	                    }
	                });
	            }
	        });
	    }
	    if ($('#ct-PathAnimation4').length > 0) {
	        var chart = new Chartist.Line('#ct-PathAnimation4 .ct-chart', {
	            labels: ['Oct', 'Nov', 'Dec'],
	            series: [[0.5, 5, 2], [6, 3, 4], [5, 8, 6]]
	        }, {
	            low: 0,
	            showArea: true,
	            showPoint: false,
	            fullWidth: true
	        });
	        chart.on('draw', function (data) {
	            if (data.type === 'line' || data.type === 'area') {
	                data.element.animate({
	                    d: {
	                        begin: 2000 * data.index,
	                        dur: 2000,
	                        from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
	                        to: data.path.clone().stringify(),
	                        easing: Chartist.Svg.Easing.easeOutQuint
	                    }
	                });
	            }
	        });
	    }
	};
	var chartistLineDashboard = function chartistLineDashboard() {
	    if ($('#ct-LineChart1').length > 0) {
	        new Chartist.Line('#ct-LineChart1 .ct-chart', {
	            labels: [10, 20, 30, 40, 50, 60],
	            series: [[5, 3, 7, 5, 2, 7, 9]]
	        }, {
	            low: 0,
	            showArea: true
	        });
	    }
	    if ($('#ct-LineChart2').length > 0) {
	        new Chartist.Line('#ct-LineChart2 .ct-chart', {
	            labels: [10, 20, 30, 40, 50, 60],
	            series: [[2, 3, 6, 8, 7, 5, 2]]
	        }, {
	            low: 0,
	            showArea: true
	        });
	    }
	    if ($('#ct-LineChart3').length > 0) {
	        new Chartist.Line('#ct-LineChart3 .ct-chart', {
	            labels: [10, 20, 30, 40, 50, 60],
	            series: [[5, 3, 7, 5, 2, 4, 9]]
	        }, {
	            low: 0,
	            showArea: true
	        });
	    }
	    if ($('#ct-LineChart4').length > 0) {
	        new Chartist.Line('#ct-LineChart4 .ct-chart', {
	            labels: [10, 20, 30, 40, 50, 60],
	            series: [[3, 4, 7, 8, 5, 3, 5]]
	        }, {
	            low: 0,
	            showArea: true
	        });
	    }
	};
	var chartistBarsDashboard = function chartistBarsDashboard() {
	    if ($('#ct-BarChart1').length > 0) {
	        new Chartist.Bar('#ct-BarChart1 .ct-chart', {
	            labels: ['JAN', 'FEB', 'MARCH', 'APRIL'],
	            series: [[800000, 1200000, 1400000, 1300000], [200000, 400000, 500000, 300000], [100000, 200000, 400000, 600000]]
	        }, {
	            stackBars: true,
	            axisY: {
	                labelInterpolationFnc: function labelInterpolationFnc(value) {
	                    return value / 1000 + 'k';
	                }
	            }
	        }).on('draw', function (data) {
	            if (data.type === 'bar') {
	                data.element.attr({
	                    style: 'stroke-width: 30px'
	                });
	            }
	        });
	    }
	    if ($('#ct-BarChart2').length > 0) {
	        new Chartist.Bar('#ct-BarChart2 .ct-chart', {
	            labels: ['MAY', 'JUNE', 'JULY', 'AUG'],
	            series: [[200000, 800000, 900000, 1300000], [205000, 505000, 305000, 805000], [505000, 700000, 1000000, 1100000]]
	        }, {
	            stackBars: true,
	            axisY: {
	                labelInterpolationFnc: function labelInterpolationFnc(value) {
	                    return value / 1000 + 'k';
	                }
	            }
	        }).on('draw', function (data) {
	            if (data.type === 'bar') {
	                data.element.attr({
	                    style: 'stroke-width: 30px'
	                });
	            }
	        });
	    }
	    if ($('#ct-BarChart3').length > 0) {
	        new Chartist.Bar('#ct-BarChart3 .ct-chart', {
	            labels: ['Sept', 'OCT', 'NOV', 'DEC'],
	            series: [[1000000, 1200000, 1400000, 1800000], [600000, 700000, 1000000, 1200000], [110000, 140000, 1600000, 1800000]]
	        }, {
	            stackBars: true,
	            axisY: {
	                labelInterpolationFnc: function labelInterpolationFnc(value) {
	                    return value / 1000 + 'k';
	                }
	            }
	        }).on('draw', function (data) {
	            if (data.type === 'bar') {
	                data.element.attr({
	                    style: 'stroke-width: 30px'
	                });
	            }
	        });
	    }
	    if ($('#ct-BarChart4').length > 0) {
	        new Chartist.Bar('#ct-BarChart4 .ct-chart', {
	            series: [[100000, 1200000, 1700000, 2000000], [200000, 500000, 900000, 3000000], [130000, 1600000, 1800000, 2000000]]
	        }, {
	            stackBars: true,
	            axisY: {
	                labelInterpolationFnc: function labelInterpolationFnc(value) {
	                    return value / 1000 + 'k';
	                }
	            }
	        }).on('draw', function (data) {
	            if (data.type === 'bar') {
	                data.element.attr({
	                    style: 'stroke-width: 30px'
	                });
	            }
	        });
	    }
	};
	var chartistBiPolarChartDashboard = function chartistBiPolarChartDashboard() {
	    if ($('#ct-BiPolarChart1').length > 0) {
	        new Chartist.Line('#ct-BiPolarChart1 .ct-chart', {
	            labels: [1, 2, 3, 4, 5, 6, 7, 8],
	            series: [[1, 2, 3, 1, -2, 0, 1, 0], [-2, -1, -2, -1, -2.5, -1, -2, -1], [0, 0, 0, 1, 2, 2.5, 2, 1], [2.5, 2, 1, 0.5, 1, 0.5, -1, -2.5]]
	        }, {
	            high: 3,
	            low: -3,
	            showArea: true,
	            showLine: false,
	            showPoint: false,
	            fullWidth: true,
	            axisX: {
	                showLabel: false,
	                showGrid: false
	            }
	        });
	    }
	    if ($('#ct-BiPolarChart2').length > 0) {
	        new Chartist.Line('#ct-BiPolarChart2 .ct-chart', {
	            labels: [1, 2, 3, 4, 5, 6, 7, 8],
	            series: [[2.5, 2, 1, 0.5, 1, 0.5, -1, -2.5], [1, 2, 3, -1, -2, 0, 1, 4], [-2, 1, -2, -1, -2.5, -1.5, -2, -1], [0, 3, 0, 1, 2, 2.5, 2, 1]]
	        }, {
	            high: 3,
	            low: -3,
	            showArea: true,
	            showLine: false,
	            showPoint: false,
	            fullWidth: true,
	            axisX: {
	                showLabel: false,
	                showGrid: false
	            }
	        });
	    }
	    if ($('#ct-BiPolarChart3').length > 0) {
	        new Chartist.Line('#ct-BiPolarChart3 .ct-chart', {
	            labels: [1, 2, 3, 4, 5, 6, 7, 8],
	            series: [[1, 2, 1, 1, -2, 0.5, 1, 0], [-2, -1, -2, -1, 2.5, -1, -2, -1], [0, 0, 0, 1.5, 2, 2.5, 2, 1], [2.5, 2, 1.5, 0.5, 1, 5, -1, 2.5]]
	        }, {
	            high: 3,
	            low: -3,
	            showArea: true,
	            showLine: false,
	            showPoint: false,
	            fullWidth: true,
	            axisX: {
	                showLabel: false,
	                showGrid: false
	            }
	        });
	    }
	    if ($('#ct-BiPolarChart4').length > 0) {
	        new Chartist.Line('#ct-BiPolarChart4 .ct-chart', {
	            labels: [1, 2, 3, 4, 5, 6, 7, 8],
	            series: [[1, 2, -3, 1, 2, 0, 1, 0], [-2, -1, -2, 4, -2.5, -1, 2, -1], [3, 0, 0, 1, 2.5, 2.5, 2, 1], [2.5, 2, 1, 0.5, 1, 0.5, -1, -2.5]]
	        }, {
	            high: 3,
	            low: -3,
	            showArea: true,
	            showLine: false,
	            showPoint: false,
	            fullWidth: true,
	            axisX: {
	                showLabel: false,
	                showGrid: false
	            }
	        });
	    }
	};
	var drawSparkline = function drawSparkline() {
	    var linePoints = [0, 1, 3, 2, 1, 1, 4, 1, 2, 0, 3, 1, 3, 4, 1, 0, 2, 3, 6, 3, 4, 2, 7, 5, 2, 4, 1, 2, 6, 13, 4, 2];
	    $('#sparkline-line').sparkline(linePoints, {
	        type: 'line',
	        width: 'calc(100% + 4px)',
	        height: '45',
	        chartRangeMax: 13,
	        lineColor: 'rgba(30, 145, 191,0.5)',
	        fillColor: 'rgba(30, 145, 191,0.4)',
	        highlightLineColor: 'rgba(0,0,0,0)',
	        highlightSpotColor: 'rgba(0,0,0,.2)',
	        tooltip: false
	    });
	    var barParent = $('#sparkline-bar').parents('.card');
	    var barPoints = [0, 1, 3, 2, 1, 1, 4, 1, 2, 0, 3, 1, 3, 4, 1, 0, 2, 3, 6, 3, 4, 2, 7, 5, 2, 4, 1, 2, 6, 13, 4, 2];
	    var barWidth = 6;
	    $('#sparkline-bar').sparkline(barPoints, {
	        type: 'bar',
	        height: $('#sparkline-bar').height() + 'px',
	        width: '100%',
	        barWidth: barWidth,
	        barSpacing: (barParent.width() - barPoints.length * barWidth) / barPoints.length,
	        barColor: 'rgba(30, 145, 191,.6)',
	        tooltipFormat: ' <span style="color: #ccc">&#9679;</span> {{value}}</span>'
	    });
	};
	exports.dashboardWebStats = dashboardWebStats;
	exports.sparklineDashboard = sparklineDashboard;
	exports.chartistLineDashboard = chartistLineDashboard;
	exports.chartistBarsDashboard = chartistBarsDashboard;
	exports.chartistBiPolarChartDashboard = chartistBiPolarChartDashboard;
	exports.chartistPathAnimationDashboard = chartistPathAnimationDashboard;
	exports.drawSparkline = drawSparkline;

/***/ }),
/* 12 */
/***/ (function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	//These javascript modules are for demo purposes.
	var iconModal = function iconModal() {
	  var icons = $('.icon');
	  var name = 'bus';
	  icons.on('click', function (e) {
	    e.preventDefault();
	    var oldName = name;
	    name = $(this).data('name');
	    var code = $(this).data('code');
	    var category = $(this).parent().parent().find('.page-header').html();
	    $('#icon-sizes i').removeClass('zmdi-' + oldName).addClass('zmdi-' + name);
	    $('#iconModal .source').html('&lt;i class="zmdi zmdi-' + name + '"&gt;&lt;/i&gt;');
	    $('#icon-code .zmdi').html('&#x' + code);
	    $('#icon-code .unicode').html('Unicode: ' + code);
	    $('#icon-code .category').html('Category: ' + category);
	    $('#iconModalLabel').html('zmdi-' + name);
	  });
	};
	var css3AnimationDemos = function css3AnimationDemos() {
	  $('.animation-demo .btn').on('click', function () {
	    var className = $(this).text();
	    var cardImg = $(this).closest('.card').find('img');
	    $(this).closest('img').addClass(className);
	    cardImg.removeAttr('class');
	    cardImg.addClass('img-circle animated ' + className);
	    setTimeout(function () {
	      cardImg.removeClass(className);
	    }, 1500);
	  });
	};
	var cardCarousel = function cardCarousel() {
	  $('#card-carousel').slick({ dots: true, infinite: true, speed: 300, slidesToShow: 1, adaptiveHeight: true });
	};
	var cardDemoMorrisChart = function cardDemoMorrisChart() {
	  if ($('#morris_card_demo').length) {
	    var data = [{
	      y: '2014',
	      a: 50,
	      b: 90
	    }, {
	      y: '2015',
	      a: 65,
	      b: 75
	    }, {
	      y: '2016',
	      a: 50,
	      b: 50
	    }, {
	      y: '2017',
	      a: 75,
	      b: 60
	    }, {
	      y: '2018',
	      a: 80,
	      b: 65
	    }, {
	      y: '2019',
	      a: 90,
	      b: 70
	    }, {
	      y: '2020',
	      a: 100,
	      b: 75
	    }, {
	      y: '2021',
	      a: 115,
	      b: 75
	    }, {
	      y: '2022',
	      a: 120,
	      b: 85
	    }, {
	      y: '2023',
	      a: 145,
	      b: 85
	    }, {
	      y: '2024',
	      a: 160,
	      b: 95
	    }],
	        config = {
	      data: data,
	      xkey: 'y',
	      ykeys: ['a', 'b'],
	      labels: ['Total Income', 'Total Outcome'],
	      fillOpacity: 0.6,
	      hideHover: 'auto',
	      behaveLikeLine: true,
	      resize: true,
	      pointFillColors: ['#ffffff'],
	      pointStrokeColors: ['black'],
	      barColors: ['#db5c60', '#f4b0b2']
	    };
	    config.element = 'morris_card_demo';
	    config.stacked = true;
	    Morris.Bar(config);
	  };
	};
	var loadThemes = function loadThemes() {
	  $('[data-load-css]').on('click', function (e) {
	    var element = $(this);
	    if (element.is('a')) e.preventDefault();
	    var uri = element.data('loadCss'),
	        link;
	    if (uri) {
	      link = swapStyleSheet(uri);
	      if (!link) {
	        $.error('Error creating stylesheet link element.');
	      }
	    } else {
	      $.error('No stylesheet location defined.');
	    }
	  });
	};
	var swapStyleSheet = function swapStyleSheet(uri) {
	  var linkId = 'autoloaded-stylesheet',
	      oldLink = $('#' + linkId).attr('id', linkId + '-old');
	  $('head').append($('<link/>').attr({ 'id': linkId, 'rel': 'stylesheet', 'href': uri }));
	  if (oldLink.length) {
	    oldLink.remove();
	  }
	  return $('#' + linkId);
	};
	var swapLayoutMode = function swapLayoutMode() {
	  $('input[name=layoutMode]').click(function () {
	    if ($('body').hasClass('boxed-layout')) {
	      $('body').removeClass('boxed-layout');
	    }
	    var getVal = $(this).val();
	    $('body').addClass(getVal);
	  });
	};
	exports.iconModal = iconModal;
	exports.css3AnimationDemos = css3AnimationDemos;
	exports.cardCarousel = cardCarousel;
	exports.cardDemoMorrisChart = cardDemoMorrisChart;
	exports.loadThemes = loadThemes;
	exports.swapLayoutMode = swapLayoutMode;

/***/ }),
/* 13 */
/***/ (function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var scrollBar = function scrollBar() {
	  if ($('.scrollbar').length > 0) {
	    $('.scrollbar').mCustomScrollbar({
	      theme: "minimal-dark",
	      scrollInertia: 1000,
	      mouseWheel: {
	        preventDefault: true
	      }
	    });
	  }
	  $("#app_main-menu-wrapper.scrollbar").mCustomScrollbar("scrollTo", ".nav-dropdown.active", { scrollInertia: 0 });
	};
	var otherScrollbarOptions = function otherScrollbarOptions() {
	  if ($('.scrollbar-minimal-light').length > 0) {
	    $('.scrollbar-minimal-light').mCustomScrollbar({
	      theme: "minimal",
	      scrollInertia: 1000,
	      mouseWheel: {
	        preventDefault: true
	      }
	    });
	  }
	  if ($('.scrollbar-light').length > 0) {
	    $('.scrollbar-light').mCustomScrollbar({
	      theme: "light",
	      scrollInertia: 1000,
	      mouseWheel: {
	        preventDefault: true
	      }
	    });
	  }
	  if ($('.scrollbar-dark').length > 0) {
	    $('.scrollbar-dark').mCustomScrollbar({
	      theme: "dark",
	      scrollInertia: 1000,
	      mouseWheel: {
	        preventDefault: true
	      }
	    });
	  }
	};
	var selectDropdowns = function selectDropdowns() {
	  $(".select.country").dropdown({ "optionClass": "withripple", "dropdownClass": "country-icons" });
	  $('.country-icons ul li').each(function () {
	    var countryOptions = $(this).text();
	    if ($.trim(countryOptions) === 'English') {
	      $(this).prepend('<img src="assets/img/icons/flags/US.png" class="max-w-20 m-r-10" alt="" />');
	    } else if ($.trim(countryOptions) === 'Español') {
	      $(this).prepend('<img src="assets/img/icons/flags/ES.png" class="max-w-20 m-r-10" alt="" />');
	    } else if ($.trim(countryOptions) === 'Français') {
	      $(this).prepend('<img src="assets/img/icons/flags/FR.png" class="max-w-20 m-r-10" alt="" />');
	    } else if ($.trim(countryOptions) === 'Italiano') {
	      $(this).prepend('<img src="assets/img/icons/flags/IT.png" class="max-w-20 m-r-10" alt="" />');
	    }
	  });
	  $(".select").dropdown({ "optionClass": "withripple" });
	};
	var countTo = function countTo() {
	  $('.timer').countTo();
	};
	var initTooltips = function initTooltips() {
	  $('[data-toggle="tooltip"]').tooltip();
	  $('[data-toggle="tooltip"]').on('shown.bs.tooltip', function () {
	    $('.tooltip').addClass('scale').css('opacity', 1);
	  });
	};
	//Ref: https://github.com/hellsan631/material-avatar
	var materialAvatar = function materialAvatar() {
	  var $mdCircleAvatar = $('.circle-profile-photo'),
	      $mdSquareAvatar = $('.square-profile-photo');
	  $mdCircleAvatar.materialAvatar({ shape: 'circle' });
	  $mdSquareAvatar.materialAvatar();
	};
	var initSliders = function initSliders() {
	  if ($('#slider-danger').length) {
	    var sliderDanger = document.getElementById('slider-danger');
	    noUiSlider.create(sliderDanger, {
	      start: 10,
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-warning').length) {
	    var sliderWarning = document.getElementById('slider-warning');
	    noUiSlider.create(sliderWarning, {
	      start: 20,
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-info').length) {
	    var sliderInfo = document.getElementById('slider-info');
	    noUiSlider.create(sliderInfo, {
	      start: 40,
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-success').length) {
	    var sliderSuccess = document.getElementById('slider-success');
	    noUiSlider.create(sliderSuccess, {
	      start: 10,
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-primary').length) {
	    var sliderPrimary = document.getElementById('slider-primary');
	    noUiSlider.create(sliderPrimary, {
	      start: 60,
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-danger-vert').length) {
	    var sliderDangerVert = document.getElementById('slider-danger-vert');
	    noUiSlider.create(sliderDangerVert, {
	      start: 10,
	      orientation: 'vertical',
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-warning-vert').length) {
	    var sliderWarningVert = document.getElementById('slider-warning-vert');
	    noUiSlider.create(sliderWarningVert, {
	      start: 20,
	      orientation: 'vertical',
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-info-vert').length) {
	    var sliderInfoVert = document.getElementById('slider-info-vert');
	    noUiSlider.create(sliderInfoVert, {
	      start: 40,
	      orientation: 'vertical',
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-success-vert').length) {
	    var sliderSuccessVert = document.getElementById('slider-success-vert');
	    noUiSlider.create(sliderSuccessVert, {
	      start: 10,
	      orientation: 'vertical',
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-primary-vert').length) {
	    var sliderPrimaryVert = document.getElementById('slider-primary-vert');
	    noUiSlider.create(sliderPrimaryVert, {
	      start: 60,
	      orientation: 'vertical',
	      connect: [true, false],
	      range: {
	        'min': 0,
	        'max': 100
	      }
	    });
	  };
	  if ($('#slider-range').length) {
	    // Initialize slider:
	    var rangeSlider = document.getElementById('slider-range');
	    var moneyFormat = wNumb({ decimals: 0, thousand: ',', prefix: '$' });
	    noUiSlider.create(rangeSlider, {
	      start: [162091, 676818],
	      step: 1,
	      range: {
	        'min': [100000],
	        'max': [1000000]
	      },
	      connect: true,
	      format: moneyFormat
	    });
	    rangeSlider.noUiSlider.on('update', function (values, handle) {
	      document.getElementById('slider-range-value1').innerHTML = values[0];
	      document.getElementById('slider-range-value2').innerHTML = values[1];
	      document.getElementsByName('min-value').value = moneyFormat.from(values[0]);
	      document.getElementsByName('max-value').value = moneyFormat.from(values[1]);
	    });
	  };
	};
	var materialDatePicker = function materialDatePicker() {
	  $('#md_input_date').bootstrapMaterialDatePicker({ weekStart: 0, time: false });
	  $('#md_input_time').bootstrapMaterialDatePicker({ date: false, format: 'HH:mm' });
	  $('#md_input_date_time').bootstrapMaterialDatePicker({ format: 'dddd DD MMMM YYYY - HH:mm' });
	};
	var pikaday = function pikaday() {
	  var picker = new Pikaday({
	    field: document.getElementById('datepicker'),
	    firstDay: 1,
	    minDate: new Date(),
	    maxDate: new Date(2020, 12, 31),
	    yearRange: [2000, 2020]
	  });
	  var pickerTheme = new Pikaday({ field: document.getElementById('datepicker-theme'), theme: 'dark-theme' });
	  var startDate,
	      endDate,
	      updateStartDate = function updateStartDate() {
	    startPicker.setStartRange(startDate);
	    endPicker.setStartRange(startDate);
	    endPicker.setMinDate(startDate);
	  },
	      updateEndDate = function updateEndDate() {
	    startPicker.setEndRange(endDate);
	    startPicker.setMaxDate(endDate);
	    endPicker.setEndRange(endDate);
	  },
	      startPicker = new Pikaday({
	    field: document.getElementById('start_date'),
	    minDate: new Date(),
	    maxDate: new Date(2020, 12, 31),
	    onSelect: function onSelect() {
	      startDate = this.getDate();
	      updateStartDate();
	    }
	  }),
	      endPicker = new Pikaday({
	    field: document.getElementById('end_date'),
	    minDate: new Date(),
	    maxDate: new Date(2020, 12, 31),
	    onSelect: function onSelect() {
	      endDate = this.getDate();
	      updateEndDate();
	    }
	  }),
	      _startDate = startPicker.getDate(),
	      _endDate = endPicker.getDate();
	  if (_startDate) {
	    startDate = _startDate;
	    updateStartDate();
	  }
	  if (_endDate) {
	    endDate = _endDate;
	    updateEndDate();
	  }
	};
	//Form validation
	var triggerFormValidation = function triggerFormValidation() {
	  $("#form-horizontal").validate({
	    highlight: function highlight(element) {
	      $(element).closest(".form-group").addClass("has-error");
	    },
	    unhighlight: function unhighlight(element) {
	      $(element).closest(".form-group").removeClass("has-error");
	    },
	    errorElement: "span",
	    errorClass: "help-block",
	    errorPlacement: function errorPlacement(element, e) {
	      e.parent(".input-group").length ? element.insertAfter(e.parent()) : e.parent("label").length ? element.insertBefore(e.parent()) : element.insertAfter(e);
	    }
	  });
	};
	
	var keepDropdownOpen = function keepDropdownOpen() {
	  $(document).on('click', '.dropdown-menu', function (e) {
	    e.stopPropagation();
	  });
	};
	var slickCarousel = function slickCarousel() {
	  $('#new_arrivals_img').slick({ dots: true, infinite: true, speed: 500, cssEase: 'linear' });
	};
	var videoPlayer = function videoPlayer() {
	  if ($('audio, video')[0]) {
	    $('video,audio').mediaelementplayer();
	  }
	};
	var initPopovers = function initPopovers() {
	  $("[data-toggle=popover]").popover();
	};
	var initToolbarjs = function initToolbarjs() {
	  // Define any icon actions before calling the toolbar
	  $('.toolbar-icons a').on('click', function (event) {
	    event.preventDefault();
	  });
	  $('button[data-toolbar="user-options"]').toolbar({
	    content: '#user-options',
	    position: 'top',
	    event: 'hover'
	  });
	  $('button[data-toolbar="transport-options"]').toolbar({
	    content: '#transport-options',
	    position: 'top',
	    event: 'hover'
	  });
	  $('button[data-toolbar="transport-options-o"]').toolbar({
	    content: '#transport-options-o',
	    position: 'bottom',
	    event: 'hover'
	  });
	  $('button[data-toolbar="content-option"]').toolbar({
	    content: '#transport-options',
	    event: 'hover'
	  });
	  $('button[data-toolbar="position-option"]').toolbar({
	    content: '#transport-options',
	    position: 'bottom',
	    event: 'hover'
	  });
	  $('button[data-toolbar="style-option"]').toolbar({
	    content: '#transport-options',
	    position: 'bottom',
	    style: 'primary',
	    event: 'hover'
	  });
	  $('button[data-toolbar="animation-option"]').toolbar({
	    content: '#transport-options',
	    position: 'bottom',
	    style: 'primary',
	    animation: 'flyin',
	    event: 'hover'
	  });
	  $('button[data-toolbar="event-option"]').toolbar({
	    content: '#transport-options',
	    position: 'bottom',
	    style: 'primary',
	    event: 'hover'
	  });
	  $('button[data-toolbar="hide-option"]').toolbar({
	    content: '#transport-options',
	    position: 'bottom',
	    style: 'primary',
	    event: 'hover',
	    hideOnClick: true
	  });
	  $('#link-toolbar').toolbar({
	    content: '#user-options',
	    position: 'top',
	    event: 'hover',
	    adjustment: 35
	  });
	  $('button[data-toolbar="set-01"]').toolbar({
	    content: '#set-01-options',
	    position: 'top',
	    event: 'hover'
	  });
	  $('button[data-toolbar="set-02"]').toolbar({
	    content: '#set-02-options',
	    position: 'left',
	    event: 'hover'
	  });
	  $('button[data-toolbar="set-03"]').toolbar({
	    content: '#set-03-options',
	    position: 'bottom',
	    event: 'hover'
	  });
	  $('button[data-toolbar="set-04"]').toolbar({
	    content: '#set-04-options',
	    position: 'right',
	    event: 'hover'
	  });
	  $(".download").on('click', function () {
	    mixpanel.track("Toolbar.Download");
	  });
	  $("#transport-options-2").find('a').on('hover', function () {
	    $this = $(this);
	    $button = $('button[data-toolbar="transport-options-2"]');
	    $newClass = $this.find('i').attr('class').substring(3);
	    $oldClass = $button.find('i').attr('class').substring(3);
	    if ($newClass != $oldClass) {
	      $button.find('i').animate({
	        top: "+=50",
	        opacity: 0
	      }, 200, function () {
	        $(this).removeClass($oldClass).addClass($newClass).css({ top: "-=100", opacity: 1 }).animate({
	          top: "+=50"
	        });
	      });
	    }
	  });
	  $('button[data-toolbar="transport-options-2"]').toolbar({
	    content: '#transport-options-2',
	    position: 'top'
	  });
	};
	exports.scrollBar = scrollBar;
	exports.selectDropdowns = selectDropdowns;
	exports.materialAvatar = materialAvatar;
	exports.initTooltips = initTooltips;
	exports.initPopovers = initPopovers;
	exports.countTo = countTo;
	exports.otherScrollbarOptions = otherScrollbarOptions;
	exports.initSliders = initSliders;
	exports.materialDatePicker = materialDatePicker;
	exports.pikaday = pikaday;
	exports.triggerFormValidation = triggerFormValidation;
	exports.keepDropdownOpen = keepDropdownOpen;
	exports.slickCarousel = slickCarousel;
	exports.videoPlayer = videoPlayer;
	exports.initToolbarjs = initToolbarjs;

/***/ })
/******/ ]);
//# sourceMappingURL=app.bundle.js.map