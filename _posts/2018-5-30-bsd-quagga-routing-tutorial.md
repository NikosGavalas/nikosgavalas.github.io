---
layout: post
title: Building networks with FreeBSD
subtitle: Guide to LANs, static and dynamic routing, both ipv4 and ipv6, with Quagga.
tags: [Networking, Routing, Quagga, FreeBSD, IPv6]
---

This is a tutorial for using the FreeBSD OS and the [Quagga](https://www.quagga.net/) software routing suite to build network architectures. 

I won't be going into the details on how the protocols work.

To emulate the needed hardware for testing purposes, I 'm using VirtualBox.

To indicate shell commands I'll be using `$`, and for quagga commands `#`.

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

## Quagga Shell
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

## RIP
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

## OSPF
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

## BGP
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
