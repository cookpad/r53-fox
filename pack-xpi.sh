#!/bin/sh
VERSION=0.1.2
XPI=r53-fox-${VERSION}.xpi

rm -rf *.xpi 
cp -r Resources/chrome ./xpi
mkdir -p xpi/defaults/preferences/
cp Resources/defaults/preferences/default.js xpi/defaults/preferences/
cd xpi/
zip -r $XPI .
mv $XPI ../
cd ../
rm -rf xpi
