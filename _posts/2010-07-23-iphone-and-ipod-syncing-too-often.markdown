---
title: IPhone and iPod syncing too often?
layout: post
---

Personally, I can't stand it that my iPhone starts syncing every time I plug it
in. I want to have it in my dock all the time and take it out when someone
calls. What I don't want, is that iTunes start syncing when I put it back in
the dock.

So I disabled automatic syncing on connect in iTunes and wrote this little
AppleScript file to manually start a sync with one click in the dock. Actually,
the AppleScript code comes from <a
		href="http://www.macosxhints.com/article.php?story=20080423220708741">Mac
		OS X Hints</a>.

<pre class="brush: applescript;">
tell application "iTunes"
	repeat with s in sources
	    if (kind of s is iPod) then update s
	end repeat
end tell
</pre>

Works like a charm! It even starts iTunes if it is not running.  Export from
AppleScript Editor as an application, put it in your Applications folder and in
your dock.

<h2>Bonus: icon</h2>

You can even give it an icon so it looks nice on your dock. To do this, open up
the application (Cmd-click -> Show Package Contents), navigate to the
<code>/Contents/Resources</code> folder and replace the applet.icns with a
nicer icon. The following location is a wonderful gem with a gazillion icons
for you to choose from.

<pre class="brush: bash;">
/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources
</pre>

I took the <code>Sync.icns</code> which is a nice orange iSync icon.
