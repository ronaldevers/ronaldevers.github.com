const CleanCSS = require("clean-css");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-syntaxhighlight"));

  eleventyConfig.addFilter("formatDate", function(date) {
    const dt = DateTime.fromJSDate(date);
    return `<time datetime="${dt.toISODate()}">${dt.toLocaleString(DateTime.DATE_MED)}</time>`;
  });

  eleventyConfig.addFilter("ronaldify", function(text) {
    return text.endsWith('Ronald Evers') ? text : `${text} | Ronald Evers`;
  });

  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  return {
    dir: {
      input: 'src',
    }
  };

};
