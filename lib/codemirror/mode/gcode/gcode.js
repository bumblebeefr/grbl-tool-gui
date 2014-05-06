CodeMirror.defineMode('gcode', function() {

  var words = {};
  function define(style, string) {
    var split = string.split(' ');
    for(var i = 0; i < split.length; i++) {
      words[split[i]] = style;
    }
  };

  // Atoms
  define('atom', 'G00 G01 G02 G03 G0 G1 G2 G3  G80');

  // Keywords
  define('keyword', 'G90 G91 G93 G94 G92 G20 G21 G92.1 ');

  // Commands
  define('builtin', 'G04 G4 G17 G18 G19 G28 G30 M3 M4 M5 G53 G54 G55 G56 G57 G58 G59 G10 L2 G10 L20 G28 G30 G28.1 G30.1 M0 M2 M30 M8 M9');

  function tokenBase(stream, state) {

    var sol = stream.sol();
    var ch = stream.next();

    if (ch === '(' ) {
      state.tokens.unshift(tokenString(")"));
      return 'comment';
    }
    if (ch === '%') {
      stream.skipToEnd();
      return 'comment';
    }
    if (ch === '$') {
      state.tokens.unshift(tokenDollar);
      return tokenize(stream, state);
    }
    if (ch === '+' || ch === '=') {
      return 'operator';
    }
    if (ch === '-') {
      stream.eat('-');
      stream.eatWhile(/\w/);
      return 'attribute';
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/\d\./);
      if(!/\w/.test(stream.peek())) {
        return 'number';
      }
    }
    stream.eatWhile(/[\w-]/);
    var cur = stream.current();
    if (stream.peek() === '=' && /\w+/.test(cur)) {
		return 'def';
	}
    return words.hasOwnProperty(cur) ? words[cur] : null;
  }

  function tokenString(quote) {
    return function(stream, state) {
      var next, end = false, escaped = false;
      while ((next = stream.next()) != null) {
        if (next === quote && !escaped) {
          end = true;
          break;
        }
        if (next === '$' && !escaped && quote !== '\'') {
          escaped = true;
          stream.backUp(1);
          state.tokens.unshift(tokenDollar);
          break;
        }
        escaped = !escaped && next === '\\';
      }
      if (end || !escaped) {
        state.tokens.shift();
      }
      return (quote === ')' ? 'comment' : 'string');
    };
  };

  var tokenDollar = function(stream, state) {
    if (state.tokens.length > 1){stream.eat('$');}
    var ch = stream.next(), hungry = /\w/;
    if (ch === '{'){hungry = /[^}]/;}
    if (ch === '(') {
      state.tokens[0] = tokenString(')');
      return tokenize(stream, state);
    }
    if (!/\d/.test(ch)) {
      stream.eatWhile(hungry);
      stream.eat('}');
    }
    state.tokens.shift();
    return 'def';
  };

  function tokenize(stream, state) {
    return (state.tokens[0] || tokenBase) (stream, state);
  };

  return {
    startState: function() {return {tokens:[]};},
    token: function(stream, state) {
      if (stream.eatSpace()) {
		return null;
	}
      return tokenize(stream, state);
    }
  };
});

CodeMirror.defineMIME('text/x-sh', 'shell');
