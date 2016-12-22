'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeOf = require('type-of');

var _typeOf2 = _interopRequireDefault(_typeOf);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Slate plugin to automatically replace a block when a string of matching
 * text is typed.
 *
 * @param {Object} opts
 * @return {Object}
 */

function AutoReplace(opts) {
  opts.trigger = normalizeTrigger(opts.trigger);
  if (opts.ignoreIn) opts.ignoreIn = normalizeMatcher(opts.ignoreIn);
  if (opts.onlyIn) opts.onlyIn = normalizeMatcher(opts.onlyIn);

  if (!opts.transform) throw new Error('You must provide a `transform` option.');
  if (!opts.trigger) throw new Error('You must provide a `trigger` option.');

  /**
   * On before input.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function onBeforeInput(e, data, state) {
    if (opts.trigger(e, data)) {
      return replace(e, data, state);
    }
  }

  /**
   * On key down.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function onKeyDown(e, data, state) {
    if (opts.trigger(e, data)) {
      return replace(e, data, state);
    }
  }

  /**
   * Replace a block's properties.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function replace(e, data, state) {
    if (state.isExpanded) return;

    var block = state.startBlock;
    var type = block.type;
    if (opts.onlyIn && !opts.onlyIn(type)) return;
    if (opts.ignoreIn && opts.ignoreIn(type)) return;

    var matches = getMatches(state);
    if (!matches) return;

    e.preventDefault();

    var _getOffsets = getOffsets(matches, state.startOffset),
        start = _getOffsets.start,
        end = _getOffsets.end;

    var transform = state.transform().moveToOffsets(start, end).delete();

    opts.transform(transform, e, data, matches);
    return transform.apply();
  }

  /**
   * Try to match the current text of a `state` with the `before` and
   * `after` regexes.
   *
   * @param {State} state
   * @return {Object}
   */

  function getMatches(state) {
    var startText = state.startText,
        startOffset = state.startOffset;
    var text = startText.text;

    var after = null;
    var before = null;

    if (opts.after) {
      var string = text.slice(startOffset);
      after = string.match(opts.after);
    }

    if (opts.before) {
      var _string = text.slice(0, startOffset);
      before = _string.match(opts.before);
    }

    // If both sides, require that both are matched, otherwise null.
    if (opts.before && opts.after && !before) after = null;
    if (opts.before && opts.after && !after) before = null;

    // Return null unless we have a match.
    if (!before && !after) return null;
    return { before: before, after: after };
  }

  /**
   * Return the offsets for `matches` with `start` offset.
   *
   * @param {Object} matches
   * @param {Number} start
   * @return {Object}
   */

  function getOffsets(matches, start) {
    var before = matches.before,
        after = matches.after;

    var end = start;

    if (before && before[1]) start -= before[1].length;
    if (after && after[1]) end += after[1].length;

    return { start: start, end: end };
  }

  /**
   * Return the plugin.
   *
   * @type {Object}
   */

  return {
    onBeforeInput: onBeforeInput,
    onKeyDown: onKeyDown
  };
}

/**
 * Normalize a `trigger` option to a matching function.
 *
 * @param {Mixed} trigger
 * @return {Function}
 */

function normalizeTrigger(trigger) {
  switch ((0, _typeOf2.default)(trigger)) {
    case 'regexp':
      return function (e, data) {
        return !!(e.data && e.data.match(trigger));
      };
    case 'string':
      return function (e, data) {
        return data.key ? data.key == trigger : e.data == trigger;
      };
  }
}

/**
 * Normalize a node matching plugin option.
 *
 * @param {Function || Array || String} matchIn
 * @return {Function}
 */

function normalizeMatcher(matcher) {
  switch ((0, _typeOf2.default)(matcher)) {
    case 'function':
      return matcher;
    case 'array':
      return function (node) {
        return matcher.includes(node);
      };
    case 'string':
      return function (node) {
        return node == matcher;
      };
  }
}

/**
 * Export.
 *
 * @type {Function}
 */

exports.default = AutoReplace;