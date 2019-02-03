---
layout: post
title: Docker Primer
subtitle: Short introduction to the famous containerization software
tags: [docker, devops, containerization]
---

I wrote this little article when I was learning about Docker, to use it for self reference. But
then I thought that other beginners may find it useful too, so why not post it on my blog?

So let's get right into it.

## What is Docker?

_If you already have an idea about what docker is, and why it's userful, skip this part._

Docker is a platform that allows you to run your applications in an **isolated environment**. These isolated environments are called *docker containers*.

Docker containers behave **like virtual machines**, meaning that they run your application in a sandboxed environment, with restricted access to the host machine's resources, but have the following differences:

- In constrast to the VMs, Docker uses the actual **host machine's kernel**. For this reason Docker containers can be started in second(s) (while VMs need significantly more time to boot) and are very expendable (you can completely remove a linux debian container for example and start another in less than a second), and
- Provides all the **software dependencies** and tools (bins/libs) needed for your app to run, in a very cohesive way. This is means that if your app runs in a docker container, then it will run and behave the same way on every other computer/server that executes the same container via Docker.

Let's think of a use case:

You have written a Python app, with quite a few dependencies. You have two options:
- You either ship it with a script, that installs all these the dependencies which also often require root priviledges and piss people off, or
- You ship it nicely wrapped in a container.

Now of course images need to be built somehow. The instructions to do so are placed in the *Dockerfile*. That's what you ship with your app, a simple file. 

Now the guy that want to run your application, will simply:
1. Build the **image** from the Dockerfile (or pull it directly from the [Docker Hub](https://hub.docker.com/))
2. And run a **container** from this image.

Simple as that.

Docker has way more capabilities than what we 'll see in this article. I will barely scratch the surface here.

Now Docker runs a *daemon* application in your system, supervising all your containers, and you can interact with it via its command-line interface.

In the rest of the article you'll find the most common docker commands.

--------

## Images

Note about the notation: all the <...> fields below are variables, used for demonstration.

List Images:
```
docker images
```

### Dockerfile
Common commands:

| Command | Explanation | Example |
| --- | --- | --- |
| `FROM <base_image>:<tag>`   | Select base image and tag to build upon (find base images at [DockerHub](https://hub.docker.com/)). | FROM ubuntu:16.04 |
| `RUN <command>`    | Runs a command on the image while building it (it is commited to the docker image). Often used to install packages.| RUN apt-get update |
| `CMD ["<command>"]` | The command the container executes by default when you launch the built image. Only one CMD allowed per Dockerfile. The CMD can be overridden when starting a container with docker run $image $other_command | CMD ["/bin/bash"] |
| `EXPOSE <port>` | Exposes a port to the host machine | EXPOSE 80 |
| `WORKDIR dir` | Sets a working directory | WORKDIR /home/node |
| `ENV <VAR_NAME> <value>` | Sets environment variables inside the image | ENV LISTEN_PORT 8080 |
| `COPY <src> <dest>`  | Copy files from src path (host) to destination path (inside the image) while building it | COPY config/php.ini /usr/local/etc/php|
| `USER <user>` | Specify a user for the container | USER root |

### Examples

#### Example 1

```docker
# FROM base_image:tag
FROM ubuntu:16.04

# Run command inside the container
RUN apt-get update
RUN apt-get install -y gcc
```

#### Example 2

```docker
FROM php:7.0-apache

# copy files from <src dir> to <destination dir>, inside the image
COPY config/php.ini /usr/local/etc/php
COPY src/ /var/www/html

# expose a port to the host machine
EXPOSE 80
```

Building an Image:
```
docker build <directory_containing_the_dockerfile>
```

Useful parameters:

| Parameter | Explanation | 
| --- | --- |
| `-t <name>`| Give a name to the image (tag) |

Remove an image:
```
docker rmi <image_ID_or_name>
```
--------

## Containers

List all containers (running):
```
docker ps
```

List all containers (running and stopped):
```
docker ps -a
```

Create (Run) Container from an Image:
```
docker run [OPTIONS] <image_ID_or_name> <initial_command>
```
, where `<initial_command>` is the command executed on the container right after it is run, (e.g. /bin/bash), and overrides the one specified in the Dockerfile with CMD.

Useful options:

| Options (with example)| Explanation | 
| --- | --- | 
| `--name my_container` | Give a name to the container | 
| `-v /home/user/src:/var/www/html` | Mount a volume (basically share directory with the host) | 
| `-p 8080:80` | Maps the port of the host to the port of the container |
| `-d` | Detached mode - run in the background | 
| `-it` | Allocates to the container a valid pseudo-tty and keeps stdin connected |
| `--env VAR1=value` | Sets environment variable to the container |
| `--restart=always` | Always restarts the container if it stops |
| `--link another_container` | Links containers together. Docker updates the /etc/hosts file in the one container to add "another_container" as a local hostname pointing to the other container. However this method is not recommended. It is better to define a docker Network (see below).| 
| `--network=mynetwork` | Places the container in a user-defined network (see Network section below). Using user-defined networks you have an internal name resolution at your disposal. You can call other containers on the same user-defined network by name. |

There are also a lot more options, allowing you to control resource allocation to the container,
networking etc. For more check [this](https://docs.docker.com/engine/reference/commandline/run/) page.

Stop Container:
```
docker stop <container_ID_or_name>
```

Start Container:
```
docker start <container_ID_or_name>
```
(with -a, it starts attached.)

Remove container:
```
docker rm <container_ID_or_name>
```

Execute a command to a running container (example):
```
docker exec -it <container_ID_or_name> echo "Hello from inside"
```

Attach local standard input, output, and error streams to a running container:
```
docker attach <container_ID_or_name>
```
If you do not see the shell, click the up arrow. To detach and leave running use CTRL+p then CTRL+q.

Create a new image from a container’s changes:
```
docker commit <container_ID_or_name> <new_image_name>
```

--------

## Network

Create a network:
```
docker network create <networkname>
```

List available networks:
```
docker network ls
```

Remove network:
```
docker network rm <networkname>
```

-------

Hope this will help you get started with Docker to "fix" the dependency hell of modern software.

For errors/suggestions, let me know asap.

<!--
## Useful links:
- https://stackoverflow.com/questions/29957653/docker-container-not-starting-docker-start
- https://stackoverflow.com/questions/26153686/how-do-i-run-a-command-on-an-already-existing-docker-container
- https://deis.com/blog/2016/connecting-docker-containers-1/
- https://deis.com/blog/2016/connecting-docker-containers-2/
-->
