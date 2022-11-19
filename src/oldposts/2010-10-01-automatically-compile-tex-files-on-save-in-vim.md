---
title: Automatically compile tex files on save in vim
permalink: /2010-10-01-automatically-compile-tex-files-on-save-in-vim/
---

If you're using the Vim editor, like me, here is another option to
automatically run commands (like compilers) when you save a file.

Put this in your `~/.vimrc`:

{% highlight vim %}
au BufWritePost _.tex,_.sty make
{% endhighlight %}

This will run the Vim-builtin `make` everytime you save a tex or sty
file.
