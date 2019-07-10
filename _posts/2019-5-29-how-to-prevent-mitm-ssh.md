---
layout: post
title: 'SSH: How to prevent MITM attacks'
subtitle: The easiest way to ensure you are not getting owned
tags: [security, devops]
---

Consider the following scenario: You connect to some remote machine for the
first time via SSH, and you get the following message:

```
nick@sapphire: $ ssh <host>
The authenticity of host '<host>' can't be established.
ECDSA key fingerprint is SHA256:I9Uxj/t8o1tSpfnA/II1BJqvMw8eELmLhRQAylPL7Lk.
Are you sure you want to continue connecting (yes/no)?
```

The SSH client gives you the SHA256 hash of the remote host's public key (its
fingerprint) and asks you to verify that the host you are attempting to
connect to *is indeed the one you want to connect to*.

If you do not verify that the fingerprint is correct,
some hosts may have changed addresses and you could end up 
connecting to the wrong server in the best case scenario, or someone may be spoofing
the hostname and execute a man-in-the-middle attack in the worst case. The MITM can then 
decrypt and read all communication between you and the remote host, by
pretending to be him.

So how do you verify the fingerprint then? Either ask the remote machine's
administrator to give you the fingerprint via another secure channel,
or if you have physical access to
the machine, run:

```
ssh-keygen -E sha256 -lf /etc/ssh/ssh_host_ecdsa_key.pub
```

You may modify this command to use a different hash (md5 for example,
like github) or a different key (the default one is the ECDSA though).

This will give you a line like this:
```
256 SHA256:I9Uxj/t8o1tSpfnA/II1BJqvMw8eELmLhRQAylPL7Lk <user>@<host> (ECDSA)
```

Therefore, the remote machine's fingerprint is:
```
I9Uxj/t8o1tSpfnA/II1BJqvMw8eELmLhRQAylPL7Lk
```

Now upon attempting to connect, the SSH client gives me this fingerprint and
asks me if it is correct. By comparing the two strings I can see that they are
the same so I know that I am actually "talking" to the server I intented to.

If I wanted to do this programmatically, I would receive the remote ECDSA key
and write it to a temporary file with:

```
ssh-keyscan -t ecdsa <host> > /tmp/pubkey
```

, and then obtain the fingerprint with (along with some output processing not
shown here):

```
ssh-keygen -E sha256 -lf /tmp/pubkey
```

I could also compare the public keys immediately if I have them both.

Now there are other ways to verify the authenticity of the remote host and
establish trust (certificates for example), but they require more complex
set-ups and are only
useful for cases where you can't have physical access to the machine or
you cannot trust that the remote server's administrator will supply you with
the correct fingerprint.
The way shown here is definitely the simplest.

Upon successful connection, the ssh client will store the fingerprint
into the `~/.ssh/known_hosts` file and trust it every time, so you don't
need to do this whole procedure every time. 
