#!/bin/sh
VERSION=0.1.2
XPI=r53-fox-${VERSION}.xpi

rm -f *.xpi
cd Resources/chrome/
zip -r $XPI .
mv $XPI ../../
