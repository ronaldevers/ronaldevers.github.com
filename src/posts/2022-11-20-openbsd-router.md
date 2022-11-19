---
title: OpenBSD router for LAN clients
permalink: /openbsd-router/
---

OpenBSD & KPN series:

This article is part of a series on using OpenBSD to replace your ISP's router.
I'm replacing a KPN / XS4ALL Fritzbox on a fiber-to-the-home connection.
Most of these instructions should apply to other ISPs as well.

1. [Basic internet connectivity](/openbsd-kpn/)
1. Serving the local network
1. Adding IPTV

Today we're going to start letting local LAN users in on the fun.
Ever since you replaced your Fritzbox the family is without internet and IPTV.
They're breathing down your neck.
The wife acceptance factor is low.
Let's restore internet access for your LAN users.

We'll set up a basic firewall, allow packet forwarding and set up a DHCP server.

## 🌐 Configure LAN interface and DHCP server

Plug a cable to your home switch into a free network interface.
For me it's the `em1` interface.
Configure the interface with a static IP address and bring it up.

```sh
echo 'inet 10.32.0.1 255.255.255.0 10.32.0.255 description "LAN" up' \
  > /etc/hostname.em1
sh /etc/netstart em1
```

Next step is to add a DHCP server.
Set up the configuration file, substituting for your own LAN IP addresses.

```sh
cat > /etc/dhcpd.conf <<EOF
option domain-name "ronaldevers.nl";
# (KPN nameservers, replace as needed)
option domain-name-servers 195.121.97.202, 195.121.97.203;

subnet 10.32.0.0 netmask 255.255.255.0 {
  option routers 10.32.0.1;
  range 10.28.0.100 10.28.0.200;
}
```

Finally, configure DHCPD to listen only on the LAN interface, enable and start it.

```sh
rcctl set dhcpd flags em1
rcctl enable dhcpd
rcctl start dhcpd
```

Clients on your LAN should now be able to get an IP address from your server.
Note we don't have to allow DHCP traffic in the firewall.
This is because `dhcpd` sneakily bypasses the firewall using BPF on (I think) a raw socket!

### 🔥 Firewall

So now we have clients connecting to the network and getting an IP address.
They just can't connect to the outside world yet because the firewall is blocking their traffic.
Let's fix that!

Using the [firewall from part 1](/openbsd-kpn/) we've already got internet access set up for the OpenBSD box itself.
So the only thing we have to add now, is to allow traffic from the LAN to go out to the internet.

```sh
cat >> /etc/pf.conf <<EOF
# wan = "pppoe0"  --  already set in part 1
lan = "em1"

pass in on \$lan inet proto { icmp, tcp, udp } to ! (self) tag LAN2WAN
pass out on \$wan tagged LAN2WAN
EOF
```

- `pass in on $lan inet proto { icmp, tcp, udp } to ! (self) tag LAN2WAN`: tag traffic
  from the LAN interface so we can let it out on WAN
- `pass out on $wan tagged LAN2WAN`: let the tagged traffic from the LAN out
  to the internet

This tagging is a simple way to establish trust between interfaces, as the pf.conf man page describes it.

Don't forget to load the new rules.

```sh
pfctl -vf /etc/pf.conf
```

And before any traffic from the LAN will flow we must enable forwarding in the kernel:

```sh
echo net.inet.ip.forwarding=1 >> /etc/sysctl.conf
sysctl net.inet.ip.forwarding=1
```

There we go: a fully functional LAN gateway / router / firewall with OpenBSD.
