#!/bin/bash

# use this for development purposes
# NOTE: when you edit the _config.yml file, you have to restart the container

docker run --rm -p 4000:4000 -v=$PWD/blog-jekyll:/srv/jekyll -it jekyll/jekyll jekyll serve --watch