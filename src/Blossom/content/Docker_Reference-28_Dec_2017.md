# Short Docker Tutorial

Note about the notation: all the $<...> fields below are variables, used for demonstration.

## Intro

**TODO:** explain what docker is how it works etc... <!-- see [this](https://www.youtube.com/watch?v=YFl2mCHdv24&t=9s) to get ideas -->

## Images

List Images: `$ docker images`

### Dockerfile
Commands:

| Command | Explanation | Example |
| --- | --- | --- |
| FROM $base_image:$tag   | Select base image and tag to build upon (find base images at DockerHub). | FROM ubuntu:16.04 |
| RUN $command    | Runs a command on the image while building it (it is commited to the docker image). Often used to install packages.| RUN apt-get update |
| CMD ["$command"] | The command the container executes by default when you launch the built image. Only one CMD allowed per Dockerfile. The CMD can be overridden when starting a container with docker run $image $other_command | CMD ["/bin/bash"] |
| EXPOSE $port | Exposes a port to the host machine | EXPOSE 80 |
| ENV $VAR_NAME $value| Sets environment variables inside the image | ENV LISTEN_PORT 8080 |
| COPY $src $dest  | Copy files from src path (host) to destination path (inside the image) while building it | COPY config/php.ini /usr/local/etc/php

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

# copy files from <src dir> to <destination dir, inside the image>
COPY config/php.ini /usr/local/etc/php
COPY src/ /var/www/html

# expose a port to the host machine
EXPOSE 80
```

Building an Image: ``` $ docker build $directory_containing_the_dockerfile ```

Useful parameters:

| Parameter | Explanation | 
| --- | --- |
| -t $name| Give a name to the image (tag) |

Remove an image: ``` $ docker rmi $image_ID_or_name ```

## Containers

List all containers (running): ``` $ docker ps ```

List all containers (running and stopped): ``` $ docker ps -a ```

Create (Run) Container from an Image: ``` $ docker run $image_ID_or_name $initial_command ```
, where $initial_command is the command executed on the container right after it is run, (e.g. /bin/bash), and overrides the one specified in the Dockerfile with CMD.

Useful parameters:

| Parameter (with example)| Explanation | 
| --- | --- | 
| --name my_container | Give a name to the container | 
| -v /home/user/src:/var/www/html | Mount a volume (share directory with the host) | 
| -p 8080:80 | Maps the port of the host to the port of the container | -p  |
| -d | Detached mode - run in the background | 
| -it | Allocates to the container a valid pseudo-tty and keeps stdin connected |
| --env VAR1=value | Sets environment variable to the container |
| --restart=always | Always restarts the container if it stops |
| --link another_container | Links containers together. Docker updates the /etc/hosts file in the one container to add "another_container" as a local hostname pointing to the other container. However this method is not recommended. It is better to define a docker Network (see below).| 
| --network=mynetwork | Places the container in a user defined network (see Network section below). Using user defined networks you have an internal name resolution at your disposal. You can call other containers on the same user defined network by name. |

There are also a lot more parameters, allowing you to control resource allocation to the container,
networking etc. For more check [this](https://docs.docker.com/engine/reference/commandline/run/) page.

Stop Container: ``` $ docker stop $container_ID_or_name```

Start Container: ``` $ docker start $container_ID_or_name``` (with -a, it starts attached.)

Remove container: ``` $ docker rm $container_ID_or_name```

Execute a command to a running container (example): ``` $ docker exec -it $container_ID_or_name echo "Hello from inside" ```.

Attach local standard input, output, and error streams to a running container: ``` $ docker attach $container_ID_or_name ```. If you do not see the shell, click the up arrow. To detach and leave running use CTRL+p then CTRL+q.

Create a new image from a container’s changes: ``` $ docker commit $container_ID_or_name $new_image_name```

## Network

Create a network: ``` $ docker network create $networkname ```

List available networks: ``` $ docker network ls ```

Remove network: ``` $ docker network rm $networkname ```


<!--
## Useful links:
- https://stackoverflow.com/questions/29957653/docker-container-not-starting-docker-start
- https://stackoverflow.com/questions/26153686/how-do-i-run-a-command-on-an-already-existing-docker-container
- https://deis.com/blog/2016/connecting-docker-containers-1/
- https://deis.com/blog/2016/connecting-docker-containers-2/
-->