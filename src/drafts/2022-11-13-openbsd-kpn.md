---
title: KPN FTTH with OpenBSD as a router and firewall
permalink: /openbsd-kpn/
draft: true
---

This article is part of a series on using OpenBSD to replace your ISP's router.
I'm replacing a KPN / XS4ALL Fritzbox (or Experia box) on a fiber-to-the-home
connection.

1. Basic internet connectivity
1. Serving the local network
1. Adding IPTV
1. Adding a DNS server

Why might you do this? In my specific case I want more control over the local
network. With the Fritzbox I was not able to send a different DNS server to
clients on the LAN vs clients on the Guest WiFi. But honestly, I'm doing it just
because I can, and to satisfy my curiosity.

This article starts with minimal steps to configure a firewall & router for KPN
or XS4ALL, on a fiber-to-the-home connection. Then we add DHCP and routing for
the local network, then IPTV and then a local caching DNS server.

## 🌐 Configuring network interfaces

The router should be connected directly to the fiber ONT box (Optical Network
Termination) in your "meterkast" with an RJ45 cable. VLAN6 on this cable is
where KPN delivers internet access over PPPOE. I'm assuming this cable is
connected to interface `em0` in your OpenBSD box.

So let's configure `em0`. It should be brought up on boot and we need a VLAN
with id 6. If we don't bring up `em0` (and `vlan6`), then the PPPOE session will
not start later. Note that we don't need IP addresses on these interfaces.

```sh
echo 'description "KPN FTTH (wan)" up' > /etc/hostname.em0
echo 'parent em0 vnetid 6 description "KPN vlan6 (internet)" up' \
  > /etc/hostname.vlan6
sh /etc/netstart
```

Next up is a [pppoe(4)](https://man.openbsd.org/pppoe.4) connection on `vlan6`.

```sh
cat > hostname.pppoe0 <<EOF
inet 0.0.0.0 255.255.255.255 NONE \\
  pppoedev vlan6 authproto pap \\
  authname internet authkey internet \\
  description "KPN PPPOE internet" \\
  up
dest 0.0.0.1
!/sbin/route add default -ifp pppoe0 0.0.0.1
EOF

sh /etc/netstart
```

Note that `0.0.0.0` and `0.0.0.1` are magical placeholders. Read
[pppoe(4)](https://man.openbsd.org/pppoe.4) to understand what they mean. Also
note that it does not matter what you enter as `authname` and `authkey`.

You should now be in business with internet access on your OpenBSD box! Your
[ifconfig(8)](https://man.openbsd.org/ifconfig.8) should look something like
this:

```sh
$ ifconfig
em0: flags=8843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	description: KPN FTTH (wan)
	media: Ethernet autoselect (1000baseT full-duplex)
	status: active
pppoe0: flags=8851<UP,POINTOPOINT,RUNNING,SIMPLEX,MULTICAST> mtu 1492
	description: KPN PPPOE internet
	dev: vlan6 state: session
	sid: 0x.... PADI retries: 0 PADR retries: 0 time: 00:10:18
	sppp: phase network authproto pap
	dns: 195.121.97.202 195.121.97.203
	groups: pppoe egress
	status: active
	inet $YOUR_PUBLIC_IP --> $KPN_PPPOE_CONCENTRATOR netmask 0xffffffff
vlan6: flags=8843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	description: KPN vlan6 (internet)
	encap: vnetid 6 parent em0 txprio packet rxprio outer
	media: Ethernet autoselect (1000baseT full-duplex)
	status: active
```

And you should be able to ping ..

```sh
$ ping openbsd.org
PING openbsd.org (199.185.178.80): 56 data bytes
64 bytes from 199.185.178.80: icmp_seq=0 ttl=244 time=125.237 ms
...
```

If DNS is not working check `/etc/resolv.conf`. It should have been updated by
[resolvd(8)](https://man.openbsd.org/resolvd.8) to something like this:

```sh
nameserver 195.121.97.202 # resolvd: pppoe0
nameserver 195.121.97.203 # resolvd: pppoe0
lookup file bind
```

If you can't ping e.g. `1.1.1.1` either, then check your PPPOE connection:

```sh
ifconfig pppoe0 debug
tail -f /var/log/messages
# turn off debugging messages when done:
ifconfig pppoe0 -debug
```

## 🔥 Basic firewall

Now let's quickly set up a very basic firewall that blocks all incoming traffic
except echo requests (pings) and SSH.

```sh
mv /etc/pf.conf /etc/pf.conf.bak
cat > /etc/pf.conf <<EOF
wan = "pppoe0"

table <martians> { \\
  0.0.0.0/8 10.0.0.0/8 127.0.0.0/8 169.254.0.0/16     \\
  172.16.0.0/12 192.0.0.0/24 192.0.2.0/24 224.0.0.0/3 \\
  192.168.0.0/16 198.18.0.0/15 198.51.100.0/24        \\
  203.0.113.0/24 }

set skip on lo0

match in all scrub (no-df random-id max-mss 1440)
match out on \$wan inet from ! (\$wan:network) nat-to (\$wan)

block return log
block drop in log quick on \$wan from { <martians>, urpf-failed }

pass out from (self)
pass in inet proto icmp to (self) icmp-type echoreq
pass in inet proto tcp to (self) port 22
EOF
```

- `match in all scrub (no-df random-id max-mss 1440)`: a bit of cargo-culting,
  not sure if you should use these or not
- `match out on $wan inet from ! ($wan:network) nat-to ($wan)`: fix source
  address on outgoing packets on WAN (masquerading)
- `block return log`: reject everything by default
- `block drop in log quick on $wan from { <martians>, urpf-failed }`: drop
  traffic from martians and traffic coming in on WAN for which the reverse path
  would not go over WAN
- `pass out`: permissive outbound for traffic from the firewall itself so we can
  do updates and send pings to anywhere etc
- `pass in inet proto icmp to (self) icmp-type echoreq`: reply to echo requests
  from anywhere
- `pass in inet proto tcp to (self) port 22`: allow SSH to the
  firewall from anywhere

Load the new rules and make sure the firewall is enabled:

```sh
pfctl -vf /etc/pf.conf
pfctl -e
```

Note, PF will happily load rules for interfaces that do not exist. So make sure
your interface names are correct!

## 🤷‍♂️ Open questions

- I don't really know if we need the `match in all scrub` rule. Or if it is even
  nice-to-have. Haven't experimented with this much due to not getting a
  time-slot from the family!
- Can the MTUs be increased? Now we've got 1500 on em0 and 1492 on pppoe0. I
  think we can do 1500 on pppoe0.
- How does the `max-mss 1440` relate to the interface MTUs?
