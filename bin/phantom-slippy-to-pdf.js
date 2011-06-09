var current, slides, viewport, output, delay;

// settings
delay = 500;
viewport = { width: 1024, height: 768 };

// init
if (phantom.state.length === 0) {
    if (phantom.args.length !== 2) {
        console.log('Usage: phantom-pdf.js URL dirname');
        phantom.exit();
    } else {
        phantom.state = 'rasterize';
        console.log('opening page');
        phantom.open(phantom.args[0]);
    }
} else {
    // run
    current = 1;
    slides = $('.slideContent').length;
    phantom.viewportSize = { width: viewport.width, height: viewport.height };
    phantom.paperSize = { width: viewport.width * 1.5, height: viewport.height * 1.5 + 30 };
    output = phantom.args[1];

    phantom.sleep(1000);
    $('.incremental').css('opacity', '1').removeClass('.incremental');

    for (;current<=slides;current++) {
        console.log('rendering slide '+current);
        phantom.sleep(delay);
        phantom.render(output+'slide'+"000".substring(current.toString().length)+current+'.pdf');
        $(document).click();
        $(document).click();
    }
    console.log('done');
    phantom.exit();
}
