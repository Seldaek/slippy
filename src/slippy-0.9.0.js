/**
 * Slippy
 * Copyright (C) 2010, Jordi Boggiano
 * http://seld.be/ - j.boggiano@seld.be
 *
 * Licensed under the new BSD License
 * See the LICENSE file for details
 *
 * Version: 0.9.0
 */

// Slide deck module
(function($) {
    var slides, curSlide, options, inOverview,
        // methods
        buildSlide, preparePreTags, executeCode, nextSlide, prevSlide, showSlide, setSlide,
        keyboardNav, antiScroll, urlChange, autoSize, clickNav, animInForward, animInRewind, animOutForward, animOutRewind;

    /**
     * Init slides
     */
    buildSlide = function(idx, el) {
        var $el = $(el),
            layout = $el.attr("layout"),
            $layout;

        // add layout to slide
        if (!layout) {
            layout = 'default';
        }
        if (($layout = $('.layout[name="' + layout + '"]').clone()).length > 0) {
            $el.addClass($layout.removeClass('layout').attr('class'));
            $el.html(function(i, html) {
                if ($layout.find('content').length === 0) {
                    throw new Error('Layouts must have a <content></content> tag that will be replaced by each slide\'s content');
                }
                return $layout
                    .find('content').replaceWith(html)
                    .end().html();
            });
        }

        $el.wrapInner('<div class="slideContent"/>');
        $el.find('pre').text(preparePreTags);
        $el.find('a.eval').click(executeCode);
    };

    preparePreTags = function(idx, content) {
        var whitespace;
        if ($(this).hasClass('eval')) {
            $(this)
                .before('<a class="eval">Execute</a>').prev()
                .data('src', content);
        }
        whitespace = content.match(/\r?\n?[ \t]+/);
        content = content.replace(new RegExp('^'+whitespace, 'gm'), '');
        return $.trim(content);
    };

    /**
     * Transforms / Sizing
     */
    autoSize = (function() {
        var timeout, winW, winH, slideW, slideH, smallestDimension,
            // methods
            resizeAll, resizeOverview, calc, centerVertically;

        calc = function() {
            winW = $(window).width();
            winH = $(window).height();

            if (winW > winH * options.ratio) {
                smallestDimension = winH;
                slideH = winH - winH * 0.15;
                slideW = slideH * options.ratio;
            } else {
                smallestDimension = winW / options.ratio;
                slideW = winW - winW * 0.15;
                slideH = slideW / options.ratio;
            }
        };

        resizeAll = function() {
            calc();

            $('body').css('fontSize', smallestDimension/40);
            slides.height(slideH)
                .width(slideW)
                .css('marginTop', -slideH/2)
                .css('marginLeft', -slideW/2);
            $('.slideContent')
                .height(slideH*0.95)
                .css('margin', (slideH*0.05).toString() + "px auto 0");
            $('img').css('width', function(val) {
                var ratio, imgWidth;
                imgWidth = $.data(this, 'origWidth');
                if (!imgWidth) {
                    imgWidth = $(this).width();
                    $.data(this, 'origWidth', imgWidth);
                }
                ratio = Math.min(imgWidth, options.baseWidth) / options.baseWidth;
                return Math.round(ratio * slideW * 0.9);
            });
            $('embed').each(function() {
                var ratio, imgWidth, newWidth, $el, $parent, $object;
                $el = $(this);
                if (!$el.parent().hasClass('embedWrapper')) {
                    $el.wrap($('<div/>').addClass('embedWrapper'));
                }
                $parent = $el.parent();
                imgWidth = $parent.data('origWidth');
                if (!imgWidth) {
                    imgWidth = $el.attr('width');
                    $parent.data('origWidth', imgWidth);
                    $parent.data('origRatio', $el.attr('height') / imgWidth);
                }
                ratio = Math.min(imgWidth, options.baseWidth) / options.baseWidth;
                newWidth = Math.round(ratio * slideW * 0.9);
                $el.attr('height', Math.round(newWidth * $parent.data('origRatio')));
                $el.attr('width', newWidth);
                $object = $el.closest('object');
                if ($object.length > 0) {
                    $object.attr('height', Math.round(newWidth * $parent.data('origRatio')));
                    $object.attr('width', newWidth);
                }
            });
            resizeOverview();
            centerVertically();
        };

        resizeOverview = function() {
            $('.overviewWrapper')
                .height(slideH * 0.13)
                .width(slideW * 0.15)
                .css('margin', slideH * 0.05);
        };

        centerVertically = function() {
            $('.vcenter')
                .css('margin-top', function() {
                    var $el = $(this);
                    return "-" + (($el.innerHeight() / 2) - slideH * 0.05 + $el.closest('.slide').find('.footer').height()) + "px";
                })
                .css('width', slideW * 0.9)
                .css('left', slideW * 0.05);
        };

        return {
            all: function() {
                clearTimeout(timeout);
                timeout = setTimeout(resizeAll, 50);
            },
            overview: resizeOverview,
            centerVertically: centerVertically
        };
    })();

    /**
     * Handle JS execute button
     */
    executeCode = function(e) {
        var slide, node, code, alert;
        slide = $(this).closest('.slide')[0];
        node = $(this).next('.syntaxhighlighter')[0];
        code = node;
        alert = $.alert;
        try {
            eval($(this).data('src'));
        } catch (error) {
            $.alert('Error: ' + error.message);
        }
    };

    /**
     * Navigation
     */
    keyboardNav = (function() {
        var targetSlide = null, switcher, timeout,
            // methods
            cleanNav;

        cleanNav = function() {
            clearTimeout(timeout);
            targetSlide = null;
            switcher.remove();
            switcher = null;
        };

        return function(e) {
            if (e.altKey || e.ctrlKey || inOverview) { return; }

            switch (e.keyCode) {
            // handle right/down arrow + space + page down
            case 32:
            case 34:
            case 39:
            case 40:
                window.scroll(0, 0);
                return nextSlide(e);

            // handle left/up arrow and page up
            case 33:
            case 37:
            case 38:
                return prevSlide(e);

            // handle home key
            case 36:
                return showSlide(0);

            // handle end key
            case 35:
                return showSlide(slides.length-1);

            // handle enter
            case 13:
                if (targetSlide !== null) {
                    if (slides[targetSlide-1] && curSlide !== targetSlide-1) {
                        showSlide(targetSlide-1);
                    }
                    cleanNav();
                }
                break;

            // handle question mark / F1
            case 112:
            case 188:
                e.preventDefault();
                // TODO show help;
                break;

            // handle delete, esc, tab for overview
            case 9:
            case 27:
            case 46:
                if ($.browser.msie < 9) { break; }
                if (inOverview) { break; }
                slides.wrap($('<div/>').addClass('overviewWrapper'));
                $('body').addClass('overview');
                slides.bind('click.slippyOverview', function (e) {
                    showSlide(slides.index(this));
                    slides
                        .unbind('.slippyOverview')
                        .unwrap();
                    $('body').removeClass('overview');
                    inOverview = false;
                });
                inOverview = true;
                autoSize.overview();
                break;

            default:
                // handle numkeys for direct access
                if ((e.keyCode >= 96 && e.keyCode <= 105 && ((e.keyCode -= 96) || true))
                    || (e.keyCode >= 48 && e.keyCode <= 57 && ((e.keyCode -= 48) || true))
                ) {
                    targetSlide *= 10;
                    targetSlide += e.keyCode;
                    if (!switcher) {
                        switcher = $('<div/>').addClass('switcherDigits').prependTo('body');
                    }
                    switcher.text(targetSlide);
                    clearTimeout(timeout);
                    timeout = setTimeout(function(){
                        cleanNav();
                    }, 1000);
                    return;
                }
            }
        };
    })();

    /**
     * Sort of fixes a bug in firefox since it doesn't
     * hide the content on the right properly this forces
     * it to scroll back into position when user presses right arrow
     */
    antiScroll = function(e) {
        if (inOverview) {
            window.scroll(0, window.pageYOffset);
        } else {
            window.scroll(0, window.pageYOffset);
        }
    };

    clickNav = (function() {
        var timeout, armed = false;

        return function(e) {
            if (e.target.nodeName === 'A') { return; }
            clearTimeout(timeout);
            if (armed === true) {
                armed = false;
                return nextSlide();
            }
            timeout = setTimeout(function() {
                armed = false;
            }, 350);
            armed = true;
        };
    })();

    animInForward = function(slide) {
        $(slide).css('left', '150%').animate({left: '50%'}, options.animLen);
    };

    animOutForward = function(slide) {
        $(slide).animate({left: '-50%'}, options.animLen);
    };

    animInRewind = function(slide) {
        $(slide).css('left', '-50%').animate({left: '50%'}, options.animLen);
    };

    animOutRewind = function(slide) {
        $(slide).animate({left: '150%'}, options.animLen);
    };

    nextSlide = function(e) {
        if (slides.length < curSlide + 2) { return; }
        if (slides[curSlide]) {
            animOutForward(slides[curSlide]);
        }
        setSlide(curSlide+1);
        animInForward(slides[curSlide]);
        $.history.load(curSlide+1);
    };

    prevSlide = function(e) {
        if (curSlide <= 0) { return; }
        animOutRewind(slides[curSlide]);
        setSlide(curSlide-1);
        if (slides[curSlide]) {
            animInRewind(slides[curSlide]);
        }
        $.history.load(curSlide+1);
    };

    showSlide = function(target) {
        var direction = 'forward';
        if (target === curSlide) { return; }
        if (slides[curSlide]) {
            direction = curSlide < target ? 'forward' : 'rewind';
            if (direction === 'forward') {
                animOutForward(slides[curSlide]);
            } else {
                animOutRewind(slides[curSlide]);
            }
        }
        setSlide(target);
        if (direction === 'forward') {
            animInForward(slides[curSlide]);
        } else {
            animInRewind(slides[curSlide]);
        }
        $.history.load(curSlide+1);
    };

    setSlide = function(num) {
        $.clearAlerts();
        if (slides[curSlide]) {
            slides.eq(curSlide).removeClass('active');
        }
        curSlide = num;
        slides.eq(curSlide).addClass('active');
        $('.slideDisplay').text((num+1)+'/'+slides.length);
    };

    urlChange = function(url) {
        url = parseInt(url, 10) - 1;
        if (curSlide !== url && slides[url]) {
            showSlide(url);
        }
    };

    $.fn.slippy = function(settings) {
        var defaults = {
            // animation duration for default anim callbacks, in milliseconds
            animLen: 350,
            // base width for proportional image scaling
            baseWidth: 620,
            // define animation callbacks, they receive a slide dom node to animate
            animInForward: animInForward,
            animInRewind: animInRewind,
            animOutForward: animOutForward,
            animOutRewind: animOutRewind,
            // width/height ratio of the slides, defaults to 1.3 (620x476)
            ratio: 1.3
        };

        options = $.extend(defaults, settings);

        slides = this;
        $('<div/>').addClass('slideDisplay').prependTo('body');

        // wrap footer divs
        $('.footer').wrapInner($('<div/>').addClass('footerContent'));

        // prep slides
        this.each(buildSlide);
        this.last().addClass('lastslide');
        $('.layout').remove();

        $(document)
            .click(clickNav)
            .keyup(keyboardNav);

        slides.touch({
            swipeLeft: nextSlide,
            swipeRight: prevSlide,
            tap: clickNav
        });

        $(window)
            .resize(autoSize.all)
            .scroll(antiScroll);

        autoSize.all();

        $.history.init(urlChange);
        if (curSlide === undefined) {
            curSlide = -1;
            nextSlide();
        }
    };
})(jQuery);

// Alert module
(function($) {
    var alerts = [];

    $.alert = function (text) {
        var alert, idx, alertWrapper = (!$('.alertWrapper').length) ? $('<div/>').addClass('alertWrapper').appendTo('body') : $('.alertWrapper');

        idx = alerts.length;
        alert = $('<div/>')
            .hide()
            .addClass('alert')
            .appendTo(alertWrapper)
            .html('<p>'+text+'</p>')
            .fadeIn(300)
            .delay(6000)
            .fadeOut(300, function() {
                $(this).remove();
                alerts[idx] = null;
            });
        alerts[idx] = alert;
    };

    $.clearAlerts = function () {
        $.each(alerts, function(idx, alert) {
            if (alert !== null) {
                alert.stop(true).remove();
            }
        });
        alerts = [];
    };
})(jQuery);

/**
 * Touch handling
 *
 * loosely based on jSwipe by Ryan Scherf (www.ryanscherf.com)
 */
(function($) {
    $.fn.touch = function(options) {
        var defaults;

        defaults = {
            threshold: {
                x: 60,
                y: 30
            },
            swipeLeft: null,
            swipeRight: null,
            tap: null
        };

        options = $.extend(defaults, options);

        return this.each(function() {
            // Private variables for each element
            var originalCoord, finalCoord;

            originalCoord = { x: 0, y: 0 };
            finalCoord = { x: 0, y: 0 };

            function touchStart(e) {
                originalCoord.x = e.targetTouches[0].pageX;
                originalCoord.y = e.targetTouches[0].pageY;
            }

            function touchMove(e) {
                finalCoord.x = e.targetTouches[0].pageX;
                finalCoord.y = e.targetTouches[0].pageY;
            }

            function touchEnd(e) {
                var changeY, changeX;
                changeY = originalCoord.y - finalCoord.y;

                if (Math.abs(changeY) < options.threshold.y) {
                    changeX = originalCoord.x - finalCoord.x;

                    if (changeX > options.threshold.x && options.swipeLeft !== null) {
                        options.swipeLeft(e);
                    } else if (changeX < -1*options.threshold.x && options.swipeRight !== null) {
                        options.swipeRight(e);
                    } else if (changeX < 5 && changeY < 5 && options.tap !== null) {
                        options.tap(e);
                    }
                }
            }

            $(this).bind("touchstart", touchStart)
                .bind("touchmove", touchMove)
                .bind("touchend", touchEnd);
        });
    };
})(jQuery);