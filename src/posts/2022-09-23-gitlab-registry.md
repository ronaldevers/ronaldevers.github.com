---
title: Cleaning up GitLab container registry
permalink: /gitlab-registry/
---

*Is your self-hosted GitLab's Docker container registry using more and
more storage space even though you configured cleanup policies in your
repositories?*

```bash
$ du -hs /opt/gitlab-rails/shared/registry
305G	/opt/gitlab-rails/shared/registry
```

You probably need to run registry garbage collection:

```bash
$ gitlab-ctl registry-garbage-collect --delete-manifests
```

This is a destructive operation so understand what it does before you
run it! When you do, then put this in a daily or weekly cronjob and
you're all set.

### Tags → manifests → layers

In Docker, image tags are pointers to image manifests and manifests
are pointers to layers. The layers use all the storage space.
GitLab's repository cleanup policies remove tags, leaving manifests
and layers behind.

Registry garbage collection deletes only unreferenced blobs by
default. Therefore, to really reclaim storage space, you need to
delete manifests that are no longer associated with any tags. This is
what the `--delete-manifests` option does.

In our case, after a few years of use, we went from over 300GB down to
17GB. Nice.

```bash
$ du -hs /opt/gitlab-rails/shared/registry
17G	/opt/gitlab-rails/shared/registry
```

### Delete untagged?

Note there is also a seemingly undocumented `--delete-untagged` option
to the garbage collector. An alias for `--delete-manifests` perhaps?
Anyone know, or gutsy enough to try it out and share the results?
