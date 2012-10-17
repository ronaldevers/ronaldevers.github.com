---
title: Automatically compile tex files on save
layout: post
---

I use this little shell script to automatically compile my latex files when I
save them. You can use it to run any command(s) when you save any
file.

<pre class="brush: bash;">
% cat ~/bin/automaker
#!/bin/sh
#
# runs the commands in the 'command()'
# function whenever the file specified
# on the command line changes
#
# Usage: automaker &lt;file_to_watch&gt;
#

command() {
	make
}

TMP_FILE=".$1"
touch $TMP_FILE
while true
do
	if [ $1 -nt $TMP_FILE ]; then
		command;
		touch $TMP_FILE;
	fi
	sleep 1
done
</pre>
