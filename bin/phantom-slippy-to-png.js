if (phantom.state.length === 0) {
    if (phantom.args.length !== 2) {
        console.log('Usage: phantom-pdf.js URL dirname');
        phantom.exit();
    } else {
        var address = phantom.args[0];
        phantom.state = 'rasterize';
        phantom.viewportSize = { width: 2048, height: 1536 };
        console.log('opening page');
        phantom.open(address);
    }
} else {
    var current = 1;
    var slides = $('.slideContent').length;
    $('.incremental').css('opacity', '1');
    var output = phantom.args[1];
    phantom.sleep(1000);
    for (;current<=slides;current++) {
        console.log('rendering slide '+current);
        phantom.sleep(500);
        phantom.render(output+'slide'+"000".substring(current.toString().length)+current+'.png');
        $(document).click();
        $(document).click();
    }
    console.log('done');
    phantom.exit();
}
