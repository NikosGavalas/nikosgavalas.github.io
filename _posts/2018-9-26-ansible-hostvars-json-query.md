---
layout: post
title: Ansible hostvars JSON querying with JMESPath
subtitle: How to get attribute values by filtering the 'hostvars' variable with JMESPath
tags: [ansible, json, jmespath, devops]
---

I was writing an ansible playbook to deploy an Apache Flink cluster, and I ran into this problem while editing the configuration files:

> How can I get the total number of the vCPUs of all the "slave" machines running on the cluster?

I thought of the `hostvars` ansible variable, which stores the gathered `facts` about the hosts, so using the `debug` module, I printed it out. The result was a JSON like that:

```json
{
    "node1": {"flink_type": "master", "ansible_processor_vcpus": 2, ...},
    "node2": {"flink_type": "slave", "ansible_processor_vcpus": 4, ...},
    "node3": {"flink_type": "slave", "ansible_processor_vcpus": 8, ...}
}
```

So all I needed to do was to _filter the nodes on the value of the attribute `flink_type` and get a list of their `ansible_processor_vcpus` values_, so that I can then sum them up with jinja, right?

Well it wasn't very easy. As it turns out, **if** my case was:

```json
{
    "nodes": [
        {"flink_type": "master", "ansible_processor_vcpus": 2, ...},
        {"flink_type": "slave", "ansible_processor_vcpus": 4, ...},
        {"flink_type": "slave", "ansible_processor_vcpus": 8, ...}
    ]
}
```

the query-solution would be as easy as `nodes[?flink_type=='slave'].ansible_processor_vcpus`, which would return the list `[4, 8]`.

But in my case, I first needed to convert the JSON into a list of objects, then get the first element of this list, and _then_ perform the filtering and attribute selection.

The solution I have found to be working correctly is this one:

```
[@.*][0][?flink_type==`slave`].ansible_processor_vcpus
```
, which is very ugly. I was hoping I could do something like `*[?flink_type=='slave'].ansible_processor_vcpus` but this doesn't work.

If there is a more elegant solution to this, I would really like to hear it, contact links are below.
