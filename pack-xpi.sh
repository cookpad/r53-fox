#!/bin/sh
VERSION=0.1.2
XPI=r53-fox-${VERSION}.xpi

rm -rf *.xpi 
cp -r Resources/chrome ./xpi
mkdir -p xpi/defaults/preferences/
cp Resources/defaults/preferences/default.js xpi/defaults/preferences/
cd xpi/
echo '.exclude-in-xpi { display:none; }' >> skin/classic/r53fox.css
zip -r $XPI .
mv $XPI ../
cd ../
rm -rf xpi
