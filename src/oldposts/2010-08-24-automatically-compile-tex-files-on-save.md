---
title: Automatically compile tex files on save
permalink: /2010-08-24-automatically-compile-tex-files-on-save/
---

I use this little shell script to automatically compile my latex files when I
save them. You can use it to run any command(s) when you save any
file.

{% highlight bash %}
% cat ~/bin/automaker
#!/bin/sh
#
# runs the commands in the 'command()'
# function whenever the file specified
# on the command line changes
#
# Usage: automaker <file_to_watch>
#

command() {
    make
}

TMP_FILE=".$1"
touch $TMP_FILE
while true
do
    if [ $1 -nt $TMP_FILE ]; then
        command
        touch $TMP_FILE
    fi
    sleep 1
done
{% endhighlight %}
