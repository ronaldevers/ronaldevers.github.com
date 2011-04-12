---
title: Rsync backup to Amazon EC2/EBS
layout: post
---

I'm going paranoid. That's why I've decided to host my email myself and not
rely on (and have to trust) a third party like Google / Gmail. Being my own
sysadmin, however, it has now become my responsibility to keep my data safe so
I decided I need some off-site backup system in place.

In this post I will walk through the creation of a script to automate rsync
backups to an Amazon Elastic Block Store volume. This script could be run, for
instance, from a cron job. I'm using rsync because it transports my data
through a secure (ssh) channel and because of its bandwidth-efficient diffing
algorithms.

By the way: yeah, I know about <a href="http://s3rsync.com">s3rsync.com</a>
(did you?), but it's way cooler and gets you much more bragging rights to build
it yourself!

The steps needed in the script are the following:

- setup
- start instance and get ip address
- attach and mount backup volume
- run rsync
- unmount and detach backup volume
- terminate instance
- cleanup

<!--more-->

Step 1: setup
-------------

First we set some environment variables to make our life easier later on.
You'll also have to get the ec2 command line tools. They are a simple download
and unzip, no further installation is required. After you have them installed,
include their bin dir in your <code>PATH</code> and tell them where they live
with the <code>EC2_HOME</code> environment variable.

<pre class="brush: bash;">
export PATH=~/bin/ec2-api-tools/bin:$PATH
export EC2_HOME=~/bin/ec2-api-tools
</pre>

Now install Java if you haven't already. You'll want to grab the official Sun
Java and not the OpenJDK version because using that resulted in some ugly
<code>ClassNotFoundException</code>s.  Tell ec2 where java lives:

<pre class="brush: bash;">
export JAVA_HOME=/usr/lib/jvm/java-6-sun
</pre>

You'll need your ec2 private key and certificate that you can generate from
your account page at AWS. Put them in your homedir and <code>chmod 400</code>
them. You'll also need to generate a keypair for logging into your instance
with SSH. The easiest way to generate the keypair is with the AWS management
console. It will give you the private key for download and install the public
key on your instances that use this keypair (we'll get to that later). In the
example below <code>ssh.pem</code> is the private part of the keypair generated
with the management console.

<pre class="brush: bash;">
export EC2_PRIVATE_KEY=~/.ec2/pk-xxxxxx.pem
export EC2_CERT=~/.ec2/cert-xxxxxx.pem
export EC2_SSH_KEY=~/.ec2/ssh.pem
</pre>

Finally, we'll set the region, availability zone, machine image (AMI) and EBS
volume that we will want to attach. Again, go to the management console or use
the command line utilities to generate an EBS volume. The EBS volume will store
the backup. The AMI listed is a Debian lenny base install from <a
		href="http://alestic.com">http://alestic.com</a>.

<pre class="brush: bash;">
export REGION=eu-west-1
export ZONE=eu-west-1b
export AMI=ami-8398b3f7
export KEY_PAIR=ssh
export BACKUP_VOLUME=vol-xxxxxxxx
</pre>

Step 2: start instance and get ip address
-----------------------------------------

Now that we have set all our environment variables, the next steps are easy! We
start 1 instance, with security group <code>ssh</code> and ask Amazon to
install the keypair we created before in the ssh <code>authorized_keys</code>
file so we can connect later on. The <code>-g ssh</code> corresponds to the
security group and defines the firewall for the instance. You'll have to go
into the management console and add a security group that allows ssh access
from your home public ip address or wherever you are backup up from.

After giving the start command, we monitor the instance, waiting until it is up
and running so we can determine its public ip address.

<pre class="brush: bash;">
INSTANCE_ID=`ec2-run-instances --region $REGION $AMI -n 1 -g ssh -k $KEY_PAIR --availability-zone $ZONE | grep INSTANCE | cut -f2`
while [ "$INSTANCE_RUNNING" != "running" ]; do
	INSTANCE_RUNNING=`ec2-describe-instances --region $REGION $INSTANCE_ID | grep INSTANCE | cut -f6`
done
PUBLIC_IP=`ec2-describe-instances --region $REGION $INSTANCE_ID | grep INSTANCE | cut -f17`
</pre>

Step 3: attach and mount backup volume
--------------------------------------

Now that the instance is running and we know its ip, we should be able to
connect to it. Unfortunately, sometimes the SSH server is not running yet if
you script the above commands. I've introduced a minute of sleep to wait for
the SSH server. We first have to attach the volume to the instance and assign
it a name (sdf in this case).

You'll have to manually do all of this once, so you can create a partition and
a filesystem on the newly attached 'sdf' virtual harddisk.

<pre class="brush: bash;">
ec2-attach-volume --region $REGION $BACKUP_VOLUME -i $INSTANCE_ID -d sdf
sleep 60 # give it a while to start the ssh server
ssh -i $EC2_SSH_KEY root@$PUBLIC_IP "mkdir /backup && mount /dev/sdf1 /backup"
</pre>

Step 4: run rsync
-----------------

With the backup volume mounted, we now proceed to run rsync. The only
non-standard option here is --rsh, because we have to tell it to use the
private key that we created earlier to authenticate to the instance.

<em>Be careful with the --delete option!</em>

<pre class="brush: bash;">
rsync -avhz --progress --delete --force --bwlimit=50 --rsh "ssh -i $EC2_SSH_KEY" /path/you/want/to/backup root@$PUBLIC_IP:/backup/some_nice_name
</pre>

Step 5: unmount and detach backup volume
----------------------------------------

<pre class="brush: bash;">
ssh -i $EC2_SSH_KEY root@$PUBLIC_IP "sync && df -h /dev/sdf1 && umount /backup"
sleep 5 # probably not necessary, just to be sure
ec2-detach-volume --region $REGION $BACKUP_VOLUME
</pre>

Step 6: terminate instance
--------------------------

Easy:

<pre class="brush: bash;">
ec2-terminate-instances --region $REGION $INSTANCE_ID</pre>

Step 7: cleanup
---------------

SSH will add an entry to your <code>known_hosts</code> file for the instance.
But because the instance is very short-lived, there is no point in keeping
these entries. If we don't prune them, they will add up and pollute your
<code>known_hosts</code> file. Luckily there is an easy fix:

<pre class="brush: bash;">ssh-keygen -R $PUBLIC_IP</pre>

This will remove the entries corresponding to the instance from the file and
make sure it stays nice and clean.

Step 8: troubleshooting
-----------------------

<em>Help!  I'm getting host key errors from SSH!</em> SSH wants you to confirm
on connect that the key fingerprint of the server matches your expectations.
You can (should) read the fingerprint from the console log of the instance
(using ec2-get-console-output) but I haven't tried to make the script check the
fingerprint. Instead, you can let ssh ignore host verification 'errors' by
adding <code>StrictHostKeyChecking no</code> to <code>~/.ssh/config</code>. I
know it's not ideal, but by setting firewall rules to only allow traffic from
your home ip and using ip addresses instead of dns names, I believe it is quite
hard for someone to perform a Man-in-the-Middle attack without you finding out
really quickly.

That's it! Stuff it in a weekly cron job, sit back and feel good about
yourself!

Statistics
----------

So how safe is our data, assuming a weekly EC2 backup schedule? The chance of
data loss equals the chance that our raid setup fails while our amazon backup
is broken or the other way around. I'm not a risk analyst but I think I like my
chances!
