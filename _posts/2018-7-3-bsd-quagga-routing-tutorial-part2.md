---
layout: post
title: Building networks with FreeBSD (Part 2)
subtitle: Guide to LANs, static and dynamic routing, both ipv4 and ipv6, with Quagga.
tags: [Networking, Routing, Quagga, FreeBSD, IPv6, Firewalls]
---

Welcome to the second part of my tutorial series. In this post we'll see how to use the Quagga Software Suite for dynamic routing.

The dynamic routing protocols we 'll use are the most widely used today: RIP, OSPF and BGP.

For some details on what these protocols are used for, and how they work, you can take a look at [this post](http://sabercomlogica.com/en/ebook/intra-as-and-inter-as-routing/).

At the end of the post you will find details for the IPv6 versions of these protocols.

**Note** about notation: to indicate shell commands I'll be using `$`, and for quagga commands `#`.

---

## Introduction to the Quagga Shell

|Mode|Command|Run it from|Prompt|
|:---:|:---:|:---:|:---:|
|Priviledged mode|`$ vtysh`|FreeBSD Shell|`#`| 
|Configuration mode| `# con t` |Priviledged Shell|`(config)#`|
| Interface Configuration mode|`(config)# int <interface>`|Configuration Shell| `(config-if)#`|
|Router Configuration mode|`(config)# router <router>`|Configuration Shell|`(config-router)#`|

To run a command that needs to be run in Priviledged mode, but through another prompt, prepend `do` to your command.

To exit a mode and return to the previous at any time, run `exit` or `ex`, or just hit `Ctrl+Z`.

To cancel a command, re-write it and prepend `no`.

To see all running configurations, run `sh run`.

Get help for command syntax with `?` at any time.

You can run quagga commands from the shell directly with `vtysh -c "my_command"`.

Save configuration:
```
# wr mem
```

### Basic interface configuration

Enter interface configuration mode for em0:
```
(config)# int em0
```
Assign static address 192.168.1.1
```
(config-if)# ip addr 192.168.1.1
```
Shutdown interface:
```
(config-if)# shutdown
```
Watch for changes in interface status:
```
(config-if)# link-detect
```

### Static routing with Quagga

Enable packet forwarding:
```
(config)# ip forwarding
```
Add static route to 192.168.1.0/24 via 192.168.1.1 with administrative distance 1 (optional):
```
(config)# ip route 192.168.1.0/24 192.168.1.1 1
```

---

## RIP Protocol

Enable RIP and enter router configuration mode for RIP:
```
(config)# router rip
```
Enable RIP on all interfaces that belong to the network with IP address 192.168.1.0/24:
```
(config-router)# net 192.168.1.0/24
```
Enable RIP on interface em0:
```
(config-router)# net em0
```
Set em0 to be a passive interface (does not send RIP updates):
```
(config-router)# passive-interface em0
```
Set RIP protocol version number (1 or 2):
```
(config-router)# version 1 (or 2)
```
Specify neighbor to unicast updates (important: RIPv2 by default RIP multicasts its updates through all associated interfaces, so this command must be combined with "passive-interface" to avoid sending simultaneously unicasts and multicasts)
```
(config-router)# neighbor 172.17.17.10
```
Change timers
```
(config-router)# timers basic <update> <timeout> <garbage>
```
See RIP status
```
# sh ip rip status
```

---

## OSPF Protocol

### Enable

Enter router configuration mode for OSPF:
```
(config)# router ospf
```
Set router ID to 1.1.1.1:
```
(config-router)# router-id 1.1.1.1
```

### Configuration

Enable OSPF on interfaces that belong in the network 192.168.0.0/16 and relate them to area 1 (area 0 is the backbone):
```
(config-router)# network 192.168.0.0/16 area 1
```
Set interface em0 to be a passive interface (does not send OSPF advertisements):
```
(config-router)# passive-interface em0
```
Specify that area 1 is of type stub (has only one router):
```
(config-router)# area 1 stub
```
Specify network type (e.g. broadcast, point-to-point etc):
```
(config-if)# ospf network <type>
```

### Information

Show OSPF general information and areas:
```
# show ip ospf
```
Show OSPF information about interface em0:
```
# show ip ospf interface em0
```
Show OSPF information about neighbors of interface em0:
```
# show ip ospf neighbor em0
```
Display LSDB:
```
# show ip ospf database
```
Display information for a specific type of LSA (e.g. router, network, summary etc):
```
# show ip ospf database <type>
```
Show OSPF routing table:
```
# show ip ospf route
``` 
Show ABRs:
```
# show ip ospf border-routers
```

---

## BGP Protocol

### Enable

Enter router configuration mode for bgp, in AS (autonomous system) 65010
```
(config)# router bgp 65010
```
### Configuration

Add network 192.168.0.0/16 to be advertised by BGP (does not activate bgp) on corresponding interfaces:
```
(config-router)# network 192.168.0.0/16
```
Add router with IP 172.17.17.1 in list of BGP neighbors in AS 65020:
```
(config-router)# neighbor 172.17.17.1 remote-as 65020
```
Set the IP address 172.17.17.1 as router ID:
```
(config-router)# bgp router-id 172.17.17.1
```
Announce static/connected/rip/ospf routes respectively:
```
(config-router)# redistribute static/connected/rip/ospf
```
Aggregate network prefixes to reduce the size of BGP routing table:
```
(config-router)# aggregate-address
```

### Information

Show general info that BGP has learned:
```
# show ip bgp 
```
...or a short summary of them:
```
# show ip bgp summary
```
Show BGP path information for network 10.0.2.1:
```
# show ip bgp 10.0.2.1
```
Show info for BGP neighbors:
```
# show ip bgp neighbors
```
Show info for neighbor 172.17.17.1:
```
# show ip bgp neighbors 172.17.17.1 
```
Show advertised routes to neighbor 172.17.17.1:
```
# show ip bgp neighbors 172.17.17.1 advertised-routes 
```
Show routes that BGP learns from neighbor 172.17.17.1:
```
# show ip bgp neighbors 172.17.17.1 routes 
```

### Applying policies

Create a filter (prefix list) of permitted (permit) or denied (deny) prefixes with name PrefixListName:
```
(config)# ip prefix-list PrefixListName permit/deny prefix 
```
Apply prefix list with name PrefixListName to neighbor 172.18.0.1 to incoming (in) or outgoing (out) traffic:
```
(config-router)# neighbor 172.18.0.1 prefix-list PrefixListName in/out 
```
Create a route map and define order=100 (sequence to insert to/delete from existing route-map entry):
```
(config)# route-map RouteMapName permit/deny 100
```
Apply route map in neighbor 172.17.17.1 to incoming (in) or outgoing (out) traffic:
```
(config-router)# neighbor 172.17.17.1 route-map RouteMapName in/out 
```

---

## IPv6

### General (Shell)

To enable ipv6 on em0 and accept Router Advertisement messages:
```
$ sysrc ifconfig_em0_ipv6="inet6 accept_rtadv"
```
Assign ipv6 address fd00:1::2/64 to interface em0:
```
$ ifconfig em0 inet6 fd00:1::2/64
```
Show routing table:
```
$ netstat -r6
```
Show ndp table (Neighbor Discovery Protocol - Substitute for ARP)
```
$ ndp -a
```
Add as default gateway the host fd00:1::1 :
```bash
$ route -6 add default fd00:1::1
```

### Routing (Quagga)

Enable daemons for ipv6:
```
$ service quagga stop
$ touch /usr/local/etc/quagga/ripngd.conf
$ chown quagga:quagga /usr/local/etc/quagga/ripngd.conf
$ touch /usr/local/etc/quagga/ospf6d.conf
$ chown quagga:quagga /usr/local/etc/quagga/ospf6d.conf
$ sysrc quagga_daemons="zebra ripd ripngd ospfd opdf6d bgpd"
$ service quagga start
```
Assign address fd00:1::1/64 to an interface:
```
(config-if)# ipv6 a fd00:1::1/64
```
Show routing table for ipv6:
```
# sh ipv6 route
```

#### Static

Add static route to network fd00:2::/64 through fd00:3::2
```
(config)# ipv6 route fd00:2::/64 fd00:3::2
```
#### Dynamic

##### RIP

Enter router configuration mode for ripng:
```
(config)# router ripng
```
Enable RIP for ipv6 on interface em0:
```
(config-router)# net em0
```

##### OSPF

Enter router configuration mode for BGP:
```
(config)# router ospf6
```
Specify 1.1.1.1 as router ID: 
```
(config-ospf6)# router-id 1.1.1.1
```
Activate ospf on interface em0 in area 0.0.0.0:
```
(config-ospf6)# int em0 area 0.0.0.0
```

##### BGP

Enter router configuration mode for BGP declaring autonomous system (AS) 65010
```
(config)# router bgp 65010
```
Set router ID 1.1.1.1:
```
(config-router)# bgp router-id 1.1.1.1
```
Disable IPv4 unicast for neighbor establishment (do this only if you use entirelly IPv6 addresses)
```
(config-router)# no bgp default ipv4-unicast
```
Declare router with address fd00:3::2 as neighbor in AS 65020: 
```
(config-router)# neighbor fd00:3::2 remote-as 65020
```
Enter submenu for address family IPv6:
```
(config-router)# address-family ipv6
```
Advertise network fd00:2::/64
```
(config-router-af)# net fd00:1::/64
```
Enable neighbor relation with fd00:3::2 :
```
(config-router-af)# neighbor fd00:3::2 activate
```

---

I hope the series was helpful. If you have any questions, feel free to send me an email.
