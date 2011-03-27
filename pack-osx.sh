#!/bin/sh
APP=R53Fox.app

rm -rf R53Fox.app *.dmg
cp -pr R53Fox-src.app R53Fox.app
cp -p /Library/Frameworks/XUL.framework/Versions/Current/xulrunner R53Fox.app/Contents/MacOS
mkdir R53Fox.app/Contents/Frameworks
rsync -rl /Library/Frameworks/XUL.framework R53Fox.app/Contents/Frameworks/
