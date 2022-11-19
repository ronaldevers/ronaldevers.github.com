---
title: Adding a Physical Disk to a Guest with Libvirt / KVM
permalink: /2012-10-14-adding-a-physical-disk-kvm-libvirt/
---

It can't be done with virt-manager. That one took me a while to figure
out. As far as I can tell, virt-manager works with storage pools. You
can make a disk into a storage pool, but you can't add an existing
disk directly to a VM.

Luckily the fix is easy: you add the disk to the domain's xml config
file by hand. So open up `/etc/libvirt/qemu/${YOUR_VM}.xml` in your
favourite editor and add a `<disk>` section to the `<devices>`
section:

{% highlight xml %}
<disk type='block' device='disk'>
  <driver name='qemu' type='raw' />
  <source dev='/dev/md/storage' />
  <target dev='vdb' bus='virtio' />
</disk>
{% endhighlight %}

This will make the host's `/dev/md/storage` available in the guest as
`/dev/vdb`. After changing a domain's config by hand, you have to
reload the config by hand. Log in to your host and issue this command:

{% highlight bash %}
# virsh define /etc/libvirt/qemu/jetsetetser.xml
Domain jetser defined from /etc/libvirt/qemu/jetsetetser.xml
{% endhighlight %}

Here is a
[nice resource with more information about managing vms with libvirt](https://help.ubuntu.com/community/KVM/Managing).
