module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-syntaxhighlight"));

  const { DateTime } = require("luxon");
  eleventyConfig.addFilter("formatDate", function(date) {
    const dt = DateTime.fromJSDate(date);
    return `<time datetime="${dt.toISODate()}">${dt.toLocaleString(DateTime.DATE_MED)}</time>`;
  });

  return {
    dir: {
      input: 'src',
    }
  };

};
