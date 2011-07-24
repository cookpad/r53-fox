#!/bin/sh
VERSION=0.1.9
SRC_DIR=r53-fox_win

rm -rf $SRC_DIR *setup.exe
cp -pr Resources $SRC_DIR
cd $SRC_DIR
cp chrome/icons/default/main-window.ico r53-fox.ico
cp /usr/local/xulrunner/xulrunner-stub.exe ./
rsync -rl /usr/local/xulrunner ./
cd ..
cygstart -w r53-fox.ci
mv setup.exe R53Fox-${VERSION}-setup.exe
rm -rf cd $SRC_DIR
