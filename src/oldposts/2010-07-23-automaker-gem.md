---
title: Automaker gem
permalink: /2010-07-23-automaker-gem/
---

After figuring out how you publish a gem, I have made (cut) my first one! In a
previous post I talk about using fsevents gem to monitor directory changes. I
have now polished it up and bundled it as a gem and published it to gemcutter.
You can now:

{% highlight bash %}
sudo gem install fsevents automaker
automaker /path/to/watch .tex
{% endhighlight %}

The first parameter to automaker is the directory to watch. `make` is run in
this directory. All other parameters are interpreted as patterns to match the
names of changed files against. If any of the filters matches any filename of
any of the changed files, `make` is called.
