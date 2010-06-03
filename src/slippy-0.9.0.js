/**
 * Slippy
 * Copyright (C) 2010, Jordi Boggiano
 * http://seld.be/ - j.boggiano@seld.be
 *
 * Licensed under the GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.txt
 *
 * Version: 0.9.0
 */

// Slide deck module
(function($) {
    var slides, curSlide, animLen = 350,
        // methods
        buildSlide, preparePreTags, executeCode, nextSlide, prevSlide, showSlide, setSlide,
        keyboardNav, urlChange;

    /**
     * Init slides
     */
    buildSlide = function(idx, el) {
        $(el).html(function(i, html) {
            return '<div class="slideContent">'+html+'</div>';
        });
        $('pre', el).text(preparePreTags);
        $('a.evalLink', el).live('click', executeCode);
        $('.vcenter').css('margin-top', function() {
            return "-" + (($(this).innerHeight() / 2) + ($('.footer', el).height())) + "px";
        });
    };

    preparePreTags = function(idx, content) {
        if ($(this).hasClass('eval')) {
            $(this)
                .before('<a class="evalLink">Execute</a>').prev()
                .data('src', content);
        }
        return $.trim(content);
    };

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
        var targetSlide = 0, switcher, timeout,
            // methods
            cleanNav;

        cleanNav = function() {
            clearTimeout(timeout);
            targetSlide = 0;
            switcher.remove();
            switcher = null;
        };

        return function(e) {
            if (e.altKey || e.ctrlKey) { return; }

            switch (e.keyCode) {
            // handle right arrow + space
            case 32:
            case 39:
                return nextSlide(e);

            // handle left arrow
            case 37:
                return prevSlide(e);

            // handle enter
            case 13:
                if (targetSlide > 0) {
                    if (slides[targetSlide-1] && curSlide !== targetSlide-1) {
                        showSlide(targetSlide-1);
                        targetSlide = 0;
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
                });
                break;

            default:
                // handle numkeys for direct access
                if ((e.keyCode >= 96 && e.keyCode <= 105 && (e.keyCode -= 96))
                    || (e.keyCode >= 48 && e.keyCode <= 57 && (e.keyCode -= 48))
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

    nextSlide = function(e) {
        if (slides.length < curSlide + 2) { return; }
        if (slides[curSlide]) {
            $(slides[curSlide]).animate({left: '-50%'}, animLen);
        }
        setSlide(curSlide+1);
        $(slides[curSlide]).css('left', '150%').animate({left: '50%'}, animLen);
        $.history.load(curSlide+1);
    };

    prevSlide = function(e) {
        if (curSlide <= 0) { return; }
        $(slides[curSlide]).animate({left: '150%'}, animLen);
        setSlide(curSlide-1);
        if (slides[curSlide]) {
            $(slides[curSlide]).css('left', '-50%').animate({left: '50%'}, animLen);
        }
        $.history.load(curSlide+1);
    };

    showSlide = function(target) {
        if (curSlide !== undefined) {
            $(slides[curSlide]).animate({left: '-50%'}, animLen);
        }
        setSlide(target);
        $(slides[curSlide]).css('left', '150%').animate({left: '50%'}, animLen);
        $.history.load(curSlide+1);
    };

    setSlide = function(num) {
        curSlide = num;
        $('.slideDisplay').text((num+1)+'/'+slides.length);
    };

    urlChange = function(url) {
        url = parseInt(url, 10) - 1;
        if (curSlide !== url && slides[url]) {
            showSlide(url);
        }
    };

    $.fn.extend({
        slippy: function() {
            slides = this;
            $('.footer')
                .css('margin-top', '-' + $('.footer').innerHeight() + 'px')
                .remove()
                .appendTo(this);
            $('<div/>').addClass('slideDisplay').prependTo('body');
            this.each(buildSlide);
            this.last().addClass('lastslide');

            $(document)
                .dblclick(nextSlide)
                .keyup(keyboardNav);

            $.history.init(urlChange);
            if (curSlide === undefined) {
                curSlide = -1;
                nextSlide();
            }
        }
    });
})(jQuery);

// Alert module
(function($) {
    $.extend({
        alert: function (text) {
            var alertWrapper = (!$('.alertWrapper').length) ? $('<div/>').addClass('alertWrapper').appendTo('body') : $('.alertWrapper');

            $('<div/>')
                .hide()
                .addClass('alert')
                .appendTo(alertWrapper)
                .html('<p>'+text+'</p>')
                .fadeIn(300)
                .delay(3000)
                .fadeOut(300, function() {
                    $(this).remove();
                });
        },
    });
})(jQuery);
