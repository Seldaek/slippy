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
    var slides, curSlide, animLen = 350,
        // methods
        buildSlide, preparePreTags, executeCode, nextSlide, prevSlide, showSlide, setSlide,
        keyboardNav, antiScroll, urlChange, autoSize, clickNav, animInForward, animInRewind, animOutForward, animOutRewind;

    /**
     * Init slides
     */
    buildSlide = function(idx, el) {
        var $el = $(el);
        $el.html(function(i, html) {
            return '<div class="slideContent">'+html+'</div>';
        });
        $el.find('pre').text(preparePreTags);
        $el.find('a.evalLink').click(executeCode);
    };

    preparePreTags = function(idx, content) {
        var whitespace;
        if ($(this).hasClass('eval')) {
            $(this)
                .before('<a class="evalLink">Execute</a>').prev()
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
        var timeout, winW, winH, slideW, slideH, smallestDimension, ratio = 1.3,
            // methods
            resizeAll, resizeOverview, calc, centerVertically;

        calc = function() {
            winW = $(window).width();
            winH = $(window).height();

            if (winW > winH * ratio) {
                smallestDimension = winH;
                slideH = winH - winH * .15;
                slideW = slideH * ratio;
            } else {
                smallestDimension = winW / ratio;
                slideW = winW - winW * .15;
                slideH = slideW / ratio;
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
                .css('margin', (slideH*.05).toString() + "px auto 0")
            $('.slideDisplay').css('left', function(idx, el){
                return winW;
            });
            resizeOverview();
            centerVertically();
        };

        resizeOverview = function() {
            $('.overviewWrapper')
                .height(slideH*.13)
                .width(slideW*.15)
                .css('margin', slideH*.05);
        };

        centerVertically = function() {
            $('.vcenter').css('margin-top', function() {
                var $el = $(this);
                return "-" + (($el.innerHeight() / 2) - slideH*.05 + $el.closest('.slide').find('.footer').height()) + "px";
            });
        };

        return {
            all: function(immediate) {
                if (immediate === true) {
                    return resizeAll();
                }
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
        var targetSlide = null, switcher, timeout, inOverview,
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
            // handle right/down arrow + space
            case 32:
            case 39:
            case 40:
                window.scroll(0, 0);
                return nextSlide(e);

            // handle left/up arrow
            case 37:
            case 38:
                return prevSlide(e);

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
                if (slides.hasClass('overview')) { break; }
                slides.wrap($('<div/>').addClass('overviewWrapper'));
                slides.add('body').addClass('overview');
                slides.bind('click.slippyOverview', function (e) {
                    showSlide(slides.index(this));
                    slides
                        .unbind('.slippyOverview')
                        .unwrap()
                        .add('body')
                        .removeClass('overview');
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
        if (e.keyCode === 39) {
            window.scroll(0, 0);
        }
    }

    clickNav = (function() {
        var timeout, armed = false;

        return function(e) {
            if (e.target.nodeName === 'A') return;
            clearTimeout(timeout);
            if (armed === true) {
                armed = false;
                return nextSlide();
            }
            timeout = setTimeout(function() {
                armed = false
            }, 350);
            armed = true;
        }
    })();

    animInForward = function(slide) {
        $(slide).css('left', '150%').animate({left: '50%'}, animLen);
    };

    animOutForward = function(slide) {
        $(slide).animate({left: '-50%'}, animLen);
    };

    animInRewind = function(slide) {
        $(slide).css('left', '-50%').animate({left: '50%'}, animLen);
    };

    animOutRewind = function(slide) {
        $(slide).animate({left: '150%'}, animLen);
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
        curSlide = num;
        $('.slideDisplay').text((num+1)+'/'+slides.length);
    };

    urlChange = function(url) {
        url = parseInt(url, 10) - 1;
        if (curSlide !== url && slides[url]) {
            showSlide(url);
        }
    };

    $.fn.slippy = function() {
        slides = this;
        $('.footer')
            .remove()
            .wrapInner($('<div/>').addClass('footerContent'))
            .appendTo(this);
        $('<div/>').addClass('slideDisplay').prependTo('body');
        this.each(buildSlide);
        this.last().addClass('lastslide');

        $(document)
            .click(clickNav)
            .keyup(keyboardNav)
            .keydown(antiScroll);

        slides.touch({
            swipeLeft: nextSlide,
            swipeRight: prevSlide,
            tap: clickNav
        });

        $(window).resize(autoSize.all);

        autoSize.all(true);

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