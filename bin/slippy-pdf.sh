#!/bin/sh
if [ "" = "$1" ]; then
    echo "Usage: ./phantom-pdf.sh <slides URL> <PDF filename>"
    exit 1
fi
if [ "" = "$2" ]; then
    echo "Usage: ./phantom-pdf.sh <slides URL> <PDF filename>"
    exit 1
fi
mkdir -p tmp-pdf/
rm -f tmp-pdf/*.png
rm -f tmp-pdf/*.pdf
rm -f tmp-pdf/*.html
phantom=`which phantomjs 2>/dev/null`
if [ "" = "$phantom" ]; then
    if [ -f './phantomjs/phantomjs' ]; then
        phantom='./phantomjs/phantomjs'
        bin='.'
    elif [ -f './bin/phantomjs/phantomjs' ]; then
        phantom='./bin/phantomjs/phantomjs'
        bin='./bin'
    else
        echo 'phantomjs could not be found, either download it and put it inside a phantomjs directory, or make it accessible through your PATH environment variable.'
        exit
    fi
fi

$phantom $bin/phantom-slippy-to-png.js $1 tmp-pdf/

cd tmp-pdf

echo '<!DOCTYPE html><html><head><title>Slippy Export</title>
<style>img, body, html, * { border: 0; margin: 0; padding: 0; line-height:0; }</style>
</head><body>' > tmp-pdf.html

for i in *.png; do
    echo "<img src='$i' />" >> tmp-pdf.html
done

echo '</body></html>' >> tmp-pdf.html
cd ..

$phantom $bin/phantom-png-to-pdf.js
mv tmp-pdf/slides.pdf $2
rm -r tmp-pdf/
