/**
 * Sentinel Library
 * A library that uses CSS animations to detect when DOM elements are added to the DOM.
 */

// --- Internal State ---

var isArray = Array.isArray;
var selectorToAnimationMap = {};
var animationCallbacks = {};
var styleEl = null;
var styleSheet = null;
var cssRules = null;

/**
 * The Sentinel Public API
 */
var sentinel = {
  /**
   * Add a watcher for specific CSS selectors.
   * @param {string | string[]} cssSelectors - A single selector string or an array of selector strings to watch.
   * @param {function(HTMLElement): void} callback - The function to call when an element is detected.
   */
  on: function on(cssSelectors, callback) {
    if (!callback) return;

    // Initialize the style element and listener only once
    if (!styleEl) {
      var doc = document;
      var head = doc.head;

      // 1. Add animationstart event listener
      // We listen at the document level to catch bubbling animation events.
      // The 'true' argument (capture phase) isn't strictly necessary for animation events
      // but ensures we catch it before other bubble listeners.
      doc.addEventListener('animationstart', function (ev) {
        var callbacks = animationCallbacks[ev.animationName];

        // If the animation name isn't in our map, it's not a Sentinel event.
        if (!callbacks) return;

        // Trigger all callbacks associated with this selector
        callbacks.forEach(function (fn) {
          return fn(ev.target);
        });
      }, true);

      // 2. Inject the stylesheet
      styleEl = doc.getElementById("sentinel-css");
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = "sentinel-css";
        head.insertBefore(styleEl, head.firstChild);
      }
      styleSheet = styleEl.sheet;
      cssRules = styleSheet.cssRules;
    }
    var selectors = isArray(cssSelectors) ? cssSelectors : [cssSelectors];
    selectors.forEach(function (selector) {
      var animId = selectorToAnimationMap[selector];
      if (!animId) {
        var isCustomName = selector[0] === '!';

        // Create a unique animation name if one wasn't provided
        animId = isCustomName ? selector.slice(1) : 'sentinel-' + Math.random().toString(16).slice(2);

        // Cache the mapping
        selectorToAnimationMap[selector] = animId;

        // 3. Add the Keyframes Rule
        // We define a keyframe that does effectively nothing (transform: none),
        // but its existence triggers the event.
        var keyframeIndex = styleSheet.insertRule("@keyframes " + animId + " {from{transform:none;}to{transform:none;}}", cssRules.length);
        cssRules[keyframeIndex]._id = selector;

        // 4. Add the Selector Rule
        // We assign the animation to the selector. 
        // 0.0001s duration ensures it fires immediately upon element creation.
        if (!isCustomName) {
          var ruleIndex = styleSheet.insertRule(selector + " { animation-duration: 0.0001s; animation-name: " + animId + "; }", cssRules.length);
          cssRules[ruleIndex]._id = selector;
        }
      }

      // Register the callback
      if (!animationCallbacks[animId]) {
        animationCallbacks[animId] = [];
      }
      animationCallbacks[animId].push(callback);
    });
  },
  /**
   * Remove a watcher for specific CSS selectors.
   * @param {string | string[]} cssSelectors - The selector(s) to stop watching.
   * @param {function(HTMLElement): void} [callback] - The specific callback to remove.
   */
  off: function off(cssSelectors, callback) {
    var selectors = isArray(cssSelectors) ? cssSelectors : [cssSelectors];
    selectors.forEach(function (selector) {
      var animId = selectorToAnimationMap[selector];
      if (!animId) return;
      var callbackList = animationCallbacks[animId];
      if (!callbackList) return;

      // Remove specific callback or clear all
      if (callback) {
        var index = callbackList.indexOf(callback);
        if (index !== -1) callbackList.splice(index, 1);
      } else {
        callbackList.length = 0;
      }

      // If callbacks remain, keep the CSS rules alive so other listeners work
      if (callbackList.length > 0) return;

      // --- Cleanup ---
      // If no listeners remain for this selector, remove the CSS rules
      for (var i = cssRules.length - 1; i >= 0; i--) {
        if (cssRules[i]._id === selector) {
          styleSheet.deleteRule(i);
        }
      }
      delete selectorToAnimationMap[selector];
      delete animationCallbacks[animId];
    });
  },
  /**
   * Reset the library state.
   * Useful for unit testing or SPA navigation cleanup.
   */
  reset: function reset() {
    selectorToAnimationMap = {};
    animationCallbacks = {};
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    styleEl = null;
    styleSheet = null;
    cssRules = null;
  }
};

// 2. Expose global for legacy browser support (<script> tags)
if (typeof window !== 'undefined') {
  window.sentinel = sentinel;

  // Dispatch the legacy load event
  var ev = document.createEvent('HTMLEvents');
  ev.initEvent('sentinel-load', false, false);
  document.dispatchEvent(ev);
}

module.exports = sentinel;
//# sourceMappingURL=sentinel.js.map
