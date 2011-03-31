#!/bin/sh
VERSION=0.1.2
XPI=r53-fox-${VERSION}.xpi

rm -rf *.xpi 
cp -r Resources/chrome ./xpi
cd xpi/
zip -r $XPI .
mv $XPI ../
cd ../
rm -rf ./xpi
