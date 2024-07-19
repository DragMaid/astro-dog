#!/bin/sh
fdate=$(date '+%Y-%m-%d')
#nodemon -e html,css,js --ignore .git/ -- ./server-dev.js >> "./logs/$fdate.log"
nodemon -e html,css,ts --ignore .git/ --exec "npm run update"
