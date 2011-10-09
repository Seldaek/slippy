var page, current, slides, viewport, output, delay;

// settings
delay = 500;
viewport = { width: 1024, height: 768 };

if (phantom.version.major == 1 && phantom.version.minor < 3) {
    console.log('This script requires PhantomJS v1.3.0+, you have v'+phantom.version.major+'.'+phantom.version.minor+'.'+phantom.version.patch);
    phantom.exit(-1);
}

if (phantom.args.length !== 2) {
    console.log('Usage: phantom-pdf.js URL dirname');
    phantom.exit(-1);
}

output = phantom.args[1];
current = 1;
page = new WebPage();
page.viewportSize = { width: viewport.width, height: viewport.height };
page.paperSize = { width: viewport.width * 1.5, height: viewport.height * 1.5 + 30 };

console.log('Loading ...');
page.open(phantom.args[0], function (status) {
    if (status !== 'success') {
        console.log('Unable to access network');
        phantom.exit();
    } else {
        slides = page.evaluate(function () {
            return $('.slideContent').length;
        });

        setTimeout(initPage, 1000);
    }
});

function initPage() {
    console.log('Rendering ...');
    page.evaluate(function () {
        $('.incremental').css('opacity', '1').removeClass('incremental');
    });
    setTimeout(renderNextSlide, delay);
}

function renderNextSlide() {
    if (current <= slides) {
        console.log('... slide '+current);
        page.render(output+'slide'+"000".substring(current.toString().length)+current+'.pdf');
        page.evaluate(function () {
            $(document).slippy().nextSlide();
        });
        current++;
        setTimeout(renderNextSlide, delay);
    } else {
        console.log('Done.');
        phantom.exit(0);
    }
}
