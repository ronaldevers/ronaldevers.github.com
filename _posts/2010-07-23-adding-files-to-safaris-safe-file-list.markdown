---
title: Adding files to Safari's "safe" file list
layout: post
---

It is always nice to spare mouse clicks. For instance, when I download an nzb
file with Safari, I want it to automatically be opened in NZB Drop. But Safari
does not consider nzb files to be "safe" so you have to open it yourself.
Blech!

Luckily <a
        href="http://mymacinations.com/2008/02/06/changing-the-systems-default-settings-for-html-files-safe/">this
        post</a> solves the problem. It boils down to the following.

1. Create a file called <pre class="brush: bash;">~/Library/Preferences/com.apple.DownloadAssessment.plist</pre>

2. with contents: <pre class="brush: xml;">
		&lt;?xml version="1.0" encoding="UTF-8"?&gt;
		&lt;!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
			"http://www.apple.com/DTDs/PropertyList-1.0.dtd"&gt;
		&lt;plist version="1.0"&gt;
			&lt;dict&gt;
				&lt;key&gt;LSRiskCategorySafe&lt;/key&gt;
				&lt;dict&gt;
					&lt;key&gt;LSRiskCategoryExtensions&lt;/key&gt;
					&lt;array&gt;&lt;string&gt;nzb&lt;/string&gt;&lt;/array&gt;
				&lt;/dict&gt;
			&lt;/dict&gt;
		&lt;/plist&gt;
</pre>

3. Restart Safari and you're done. Nice!

See the <a href="http://mymacinations.com/2008/02/06/changing-the-systems-default-settings-for-html-files-safe/">original post over at mymacinations.com</a> for some more detailed information.
