if (phantom.state.length === 0) {
    phantom.state = 'rasterize';
    phantom.viewportSize = { width: 2048, height: 2000 };
    phantom.paperSize = { width: 2048, height: 1536+4 };
    console.log('opening page');
    phantom.open("tmp-pdf/tmp-pdf.html");
} else {
    phantom.sleep(500);
    phantom.render("tmp-pdf/slides.pdf");
    phantom.exit();
}
