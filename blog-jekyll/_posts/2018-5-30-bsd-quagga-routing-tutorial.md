---
layout: post
title: Building networks with FreeBSD
subtitle: Guide to LANs, static and dynamic routing, both ipv4 and ipv6, with Quagga.
tags: [Networking, Routing, Quagga, FreeBSD, IPv6]
---

This is a tutorial for using the FreeBSD OS and the [Quagga](https://www.quagga.net/) software routing suite to build network architectures. 

I won't be going into the details on how the protocols work.

To emulate the needed hardware for testing purposes, I 'll be using VirtualBox.

# FreeBSD
System Configuration in `/etc/rc.conf`.
Instead of directly editing the file it's better to use `sysrc`. 

# Quagga Shell
|Mode|Command|Run it from|Prompt|
|:---:|:---:|:---:|:---:|
|Priviledged mode|`vtysh`|FreeBSD Shell|`$`| 
|Configuration mode| `con t` |Priviledged Shell|`(config)`|
| Interface Configuration mode|`int <interface>`|Configuration Shell| `(config-if)`|
|Router Configuration mode|`router <router>`|Configuration Shell|`(config-router)`|

To run a command that needs to be run in Priviledged mode, but through another prompt, prepend `do` to your command.

To exit a mode and return to the previous at any time, run `exit` or `ex`, or just hit `Ctrl+Z`.

To cancel a command, prepend `no`.

To see all running configurations, run `sh run`.

To view the routing table, run `sh ip route` for IPv4, and `sh ipv6 route` for IPv6.

# IPv6

## General (Shell)
To enable ipv6 on em0 and accept Router Advertisement messages:
```bash
sysrc ifconfig_em0_ipv6="inet6 accept_rtadv"
```
Assign ipv6 address fd00:1::2/64 to an interface:
```bash
ifconfig em0 inet6 fd00:1::2/64
```
Show routing table:
```bash
netstat -r6
```
Show ndp table (Neighbor Discovery Protocol - Substitute for ARP)
```bash
ndp -a
```
Add as default gateway the host fd00:1::1 :
```bash
route -6 add default fd00:1::1
```
## Routing (Quagga)
Enable daemons for ipv6:
```
service quagga stop
touch /usr/local/etc/quagga/ripngd.conf
chown quagga:quagga /usr/local/etc/quagga/ripngd.conf
touch /usr/local/etc/quagga/ospf6d.conf
chown quagga:quagga /usr/local/etc/quagga/ospf6d.conf
sysrc quagga_daemons="zebra ripd ripngd ospfd opdf6d bgpd"
service quagga start
```
Assign address fd00:1::1/64 to an interface:
```
(config) ipv6 a fd00:1::1/64
```
### Static
Add static route to network fd00:2::/64 through fd00:3::2
```
(config) ipv6 route fd00:2::/64 fd00:3::2
```
### Dynamic
#### RIP
Enable RIP for ipv6 on interface em0:
```
(config) router ripng
(config-router) net em0
```
#### OSPF
```
(config) router ospf6

```
#### BGP
```
```