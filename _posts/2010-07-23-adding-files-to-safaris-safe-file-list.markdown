---
title: Adding files to Safari's safe file list
layout: post
---

It is always nice to spare mouse clicks. For instance, when I download an nzb
file with Safari, I want it to automatically be opened in NZB Drop. But Safari
does not consider nzb files to be "safe" so you have to open it yourself.
Blech!

Luckily <a class="dead-link"
href="http://mymacinations.com/2008/02/06/changing-the-systems-default-settings-for-html-files-safe/">this
post</a> solves the problem. It boils down to the following.

Create a file called `~/Library/Preferences/com.apple.DownloadAssessment.plist`

With the following contents:

{% highlight xml %}
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>LSRiskCategorySafe</key>
    <dict>
      <key>LSRiskCategoryExtensions</key>
      <array><string>nzb</string></array>
    </dict>
  </dict>
</plist>{% endhighlight %}

Restart Safari and you're done. Nice!

See the <a class="dead-link"
href="http://mymacinations.com/2008/02/06/changing-the-systems-default-settings-for-html-files-safe/">original
post over at mymacinations.com</a> for some more detailed information.
