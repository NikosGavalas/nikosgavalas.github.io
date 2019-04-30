#!/bin/bash

# use this for development purposes
# NOTE: when you edit the _config.yml file, you have to rebuild

docker run --rm -v="$PWD:/srv/jekyll" -v="/tmp/docker-jekyll:/usr/local/bundle" -it jekyll/jekyll jekyll build
docker run --rm -p 4000:4000 -v="$PWD/_site:/srv/jekyll" -it jekyll/jekyll jekyll serve --watch
