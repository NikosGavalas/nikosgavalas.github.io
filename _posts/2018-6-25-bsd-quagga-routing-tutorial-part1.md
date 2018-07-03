---
layout: post
title: Building networks with FreeBSD (Part 1)
subtitle: Guide to LANs, static and dynamic routing, both ipv4 and ipv6, with Quagga.
tags: [Networking, Routing, Quagga, FreeBSD, IPv6, Firewalls]
---

Welcome to my tutorial series for using the FreeBSD OS and the [Quagga](https://www.quagga.net/) software routing suite for building network architectures. 

I hope this series serves a good reference point for anyone interested in examining and getting hands-on experience with the routing protocols and network topologies. However I won't be going into the details on how the protocols work.

To emulate the needed hardware for testing purposes, I 'm using VirtualBox, and I recommend it.

For instructions on installing [FreeBSD](https://www.freebsd.org/where.html) and [Quagga](https://www.quagga.net/) you can look at their websites.

This post is the first part, in which we'll give an overview of the networking capabilities and tools of the FreeBSD OS. We'll see how to properly configure the system, how to create bridges, VLANs, how to route packets statically, as well as an introduction to the ipfw firewall, with some examples.

---

## FreeBSD

System Configuration in `/etc/rc.conf`.
Instead of directly editing the file it's better to use `sysrc`. 

### rc.conf - sysrc

Enable packet forwarding (act as gateway)
```
$ sysrc gateway_enable="YES"
```

Set hostname (kept after reboot):
```
$ sysrc hostname="router.example.com"
```

Configure interfaces:
```
$ sysrc ifconfig_em0="inet 10.10.10.100 netmask 255.255.255.0"
$ sysrc ifconfig_em1="DCHP" # aquire address from DHCP
```

Set gateway 10.10.10.100:
```
$ sysrc defaultrouter="10.10.10.100"
```

### ifconfig

Activate/Deactivate interface em0:
```
$ ifconfig em0 up/down
```

Specify address 192.168.1.1, netmask 255.255.255.0 and broadcast address 192.168.1.255 on em0:
```
$ ifconfig em0 192.168.1.1 netmask 255.255.255.0 broadcast 192.168.1.255
```

Quicker way:
```
$ ifconfig em0 192.168.1.1/24
```

Delete address from interface em0:
```
$ ifconfig em0 delete
```

### dhclient

Activate DHCP client on interface em0:
```
$ dhclient em0
```
### tcpdump

(Credits to Daniel Miessler, more examples [here](https://danielmiessler.com/study/tcpdump/))

#### Useful flags

- `-i any` : Listen on all interfaces
- `-i em0` : Listen on interface em0
- `-n` : Don't resolve hostnames
- `-t` : Human-readable timestamp output
- `-tttt` : Maximally human-readable timestamp output
- `-A` : Packet contents in ascii
- `-X` : Show packets contents in both hex and ascii
- `-v, -vv, -vvv` : Verbosity
- `-e` : Show ethernet header too
- `-S` : Absolute sequence numbers

#### Expressions

Useful keywords are:

|Keyword|Description|
|:---:|:---|
|`host`|All traffic associated with specified host|
|`net`|All traffic associated with specified network|
|`port`|All traffic associated with specified port|
|`src`|Traffic source|
|`dst`|Traffic destination|
|`tcp`|Protocol TCP|
|`udp`|Protocol UDP|
|`icmp`|Protocol ICMP|

Combine the keywords with `and` (or `&&`), `or` (or `||`), `not` (or `!`).

#### Files

Write output to PCAP file:
```
$ tcpdump -w pcap_file
```

Read PCAP file:
```
$ tcpdump -r pcap_file
```

#### Examples

No hostnames/ports resolution, be very verbose, use absolute sequence numbers and show traffic coming from host 10.5.2.3 and has destination the port number 3389:
```
$ tcpdump -nnvvvS src 10.5.2.3 and dst port 3389
```

No hostname/ports resolution, show ethernet header, and display all packets that either use the udp protocol or they come from host 192.168.1.2 and go to network 192.168.1.0/24:
```
$ tcpdump -nne 'udp or (src 192.168.1.2 and dest net 192.168.1.0/24)'
```

### netstat

Show active connections without name resolution:
```
$ netstat -an
```

Show routing table without name resolution:
```
$ netstat -rn
```

---

## LANs

### ARP

View arp table
```
$ arp -a
```

Clear arp table
```
$ arp -d -a
```

### Bridges

Create/Destroy a network pseudo-device bridge called bridgeX where X=0:
```
$ ifconfig bridge0 create/destroy
```

Add as members the interface em0, em1, em2 and enable bridge0 (run ifconfig em0 up etc first):
```
$ ifconfig bridge0 addm em0 addm em1 addm em2 up 
```

Remove interface em0 from bridge0:
```
$ ifconfig bridge0 deletem em0 
```

View the addresses that bridge0 has learned and associated ports:
```
$ ifconfig bridge0 addr 
```

Clear addresses that have been learned dynamically:
```
$ ifconfig bridge0 flush 
```

Enable the STP protocol on interfaces em0, em1, em2 of bridge bridge0:
```
$ ifconfig bridge0 stp em0 stp em1 stp em2 
```

Disable the STP protocol on interfaces em0, em1, em2 of bridge bridge0:
```
$ ifconfig bridge0 -stp em0 -stp em1 -stp em2 
```

Set priority value for bridge bridge0 (default value is 32768, minimum 0 and maximum is 61440):
```
$ ifconfig bridge0 priority value 
```

Set priority value for interface em0 of bridge bridge0:
```
$ ifconfig bridge0 ifpriority em0 <value>
```

Set cost for path through em0 of bridge bridge0:
```
$ ifconfig bridge0 ifpathcost em0 <value> 
```

### Link aggregation

Create a network pseudo-device for aggregating links, called laggX, where X=0 for example: 
```
$ ifconfig lagg0 create 
```

Add interface em0 to lagg0:
```
$ ifconfig lagg0 laggport em0
```

Remove interface em0 from lagg0:
```
$ ifconfig lagg0 -laggport em0
```

Specify aggregation protocol (default value is failov):
```
$ ifconfig lagg0 laggproto proto
```

### VLANs

Create pseudo-interface VLAN based on interface em0, that belongs to vlan with vlan_tag=5, and assign IP address 192.168.20.20/24: 
```
$ ifconfig em0.5 create vlan 5 vlandev em0 inet 192.168.20.20/24
```

Create only the pseudo-interface with vlan_tag=5:
```
$ ifconfig em0.5 create
```

---

## Routing Basics

Enable packet forwarding:
```
$ systcl net.inet.ip.forwarding=1
```

Enable proxy ARP
```
$ sysctl net.link.ether.inet.proxyall=1
```

View system routing table:
```
$ netstat -r
```

Add default route:
```
$ route add default 192.168.1.1
```

Add route to network 192.168.0.0/16 through gateway 192.168.1.1
```
$ route add -net 192.168.0.0/16 192.168.1.1
```

Add route to host 192.168.1.2 through gateway 192.168.1.1
```
$ route add -host 192.168.1.2 192.168.1.1
```

Change gateway for already defined route to network 192.168.0.0/16:
```
$ route change -net 192.168.0.0/16 192.168.2.1
```

Show route for specified destination
```
$ route show <destination>
```

Delete route for destination
```
$ route del <destination>
```

Delete all routes
```
$ route flush
```

---

## Firewall (ipfw)

Enable by loading the corresponding kernel module:
```
$ kldload ipfw
```

Add ipfw rule:
```
$ ipfw add rule_number action proto from src src_port to dst dst_port options
```
, where:
- rule_number: The sequence number of the rule (value in range 1-65535)
- action: can be `allow`, `deny`, or `check-state`
- proto: `ip4`, `ip6`, `all` for any protocol, etc
- src: source address
- src_port: source port
- dst: destination address
- dst_port: destination port
- options: `in` or `out` for direction, `via` to specify interface, `icmptypes <type>`, `keep-state` (which will create a dynamic rule to allow bi-directional communication for matching protocol and port), and more.

Show ipfw rules:
```
$ ipfw show
```

Flush all rules:
```
$ ipfw flush
```

### NAT (in-kernel, on ipfw)

Add entry to the NAT table:
```
$ ipfw nat nat_number config nat_config
```
, where nat_number is instance number on the NAT table and nat_config can be:
- ip _ip_address_: specify address to be used for translation
- if _nic_: use address of card _nic_, even if it changes dynamically
- same_ports: try to not change the ports
- reset: resets the table if addresses change
- deny_in: denies all incoming traffic
- redirect_addr _localIP_ _publicIP_: translate _publicIP_ to _localIP_ and vice versa
- redirect_proto _proto_ _localIP_ [publicIP [remoteIP]]: same but for protocol _proto_
- redirect_port _proto_ _targetIP:targetPort_ [_aliasIP:_]_aliasPort_ [_remoteIP_[:_remotePort_]]: basically port forwarding


Show all NAT tables:
```
$ ipfw nat show config
```

### Examples

```
$ ipfw add 100 deny ip from 1.2.3.0/24 to me
```

```
$ ipfw add 200 allow tcp from me to any keep-state
```

Create an in-kernel NAT table with instance number 123 so that packets forwarded to it (matched by the corresponding ipfw rule) have their addresses translated to the address of interface em0, they reset when addresses change and traffic going to 172.16.16.2 (em0) is translated to 192.168.1.3. Then attach this table to ipfw rule 100:

```
$ ipfw nat 123 config if em0 reset redirect_addr 192.168.1.3 172.16.16.2
$ ipfw add 100 nat 123 all from any to any
```

---

In the next post, we'll see how to use Quagga for dynamic routing, both in IPv4 and IPv6.
