/*****************************************
 * Source: https://gist.github.com/yemster/b4b62e31fbb95a84b45b00b7958e6bcc
 * Usage:
 *   engine = Adequate.TemplateEngine
 *   template = 'My name is <% this.name %>'
 *   hash = { name: 'Yemi' }
 *
 *   compiled = engine.compile(template)     // => "var r=[] ; r.push("My name is "); r.push( this.name ); return r.join  ("");"
 *   engine.render(compiled, hash)           // => My name   is Yemi
 *
 * engine.render(compiled, { name: 'Mike' }) // => My name   is Mike
 *****************************************/

window.Adequate = {};
Adequate.TemplateEngine = (function () {
  var compileTemplate = function (html) {
    var re = /\[\%([^%\]]+)?\%\]/g,
      reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
      code = 'var r=[];\n',
      cursor = 0,
      match;
    var add = function (line, js) {
      js ? (code += line.match(reExp) ?
          line + '\n' : 'r.push(' + line + ');\n') :
        (code += line !== '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
      return add;
    }

    while (match = re.exec(html)) {
      add(html.slice(cursor, match.index))(match[1], true);
      cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));

    return code += 'return r.join("");';
  },

  renderTemplate = function (tmpl, obj) {
    return new Function(tmpl.replace(/[\r\t\n]/g, '')).apply(obj);
  };

  return {
    compile: function (html) {
      return compileTemplate(html)
    },

    render: function (tmpl, obj) {
      return renderTemplate(tmpl, obj)
    }
  }
})()
