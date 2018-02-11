"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var JQuery = require("jquery");
var $ = JQuery;
var Orientations;
(function (Orientations) {
    Orientations["HORIZONTAL"] = "horizontal";
    Orientations["VERTICAL"] = "vertical";
})(Orientations = exports.Orientations || (exports.Orientations = {}));
;
var DragDirections;
(function (DragDirections) {
    DragDirections["Left"] = "left";
    DragDirections["Right"] = "right";
    DragDirections["Top"] = "top";
    DragDirections["Bottom"] = "bottom";
})(DragDirections = exports.DragDirections || (exports.DragDirections = {}));
;
var SliderScrollTrails;
(function (SliderScrollTrails) {
    SliderScrollTrails["Left"] = "left";
    SliderScrollTrails["Right"] = "right";
    SliderScrollTrails["Top"] = "top";
    SliderScrollTrails["Bottom"] = "bottom";
})(SliderScrollTrails = exports.SliderScrollTrails || (exports.SliderScrollTrails = {}));
;
;
var osliderId = 0;
var Oslider = /** @class */ (function () {
    function Oslider(selector, options) {
        this.currentSlide = 0;
        this.$currentActiveSlides = [];
        this.sliderContainerDimension = {
            height: 200,
            width: 200,
        };
        this.isReiniting = false;
        this.SLIDER_LENGTH = 999; // the default length of the slider depending on it's orientation [HORIZONTAL | VERTICAL]
        this.sliderDimension = {
            width: '100%',
            length: this.SLIDER_LENGTH
        };
        this.slideWidth = 0;
        this.orientations = {
            HORIZONTAL: 'horizontal',
            VERTICAL: 'vertical',
        };
        this.defaultOptions = {
            visibleSlides: 1,
            scrollSlides: 1,
            orientation: this.orientations.HORIZONTAL,
            slideSize: null,
            scrollPos: 0,
            sliderWidth: 999,
            sliderHeight: "auto",
            slideTo: 0,
            showNav: false,
            dotNav: false,
            autoplay: false,
            autoplaySpeed: 5000,
            infinite: false,
            onSwipeEventHandler: Object,
            onPreswipeEventHandler: Object,
            onPostswipeEventHandler: Object,
            onInitilizeEventHandler: Object,
        };
        this.dragStartPos = null;
        this.sliderOffset = 0;
        this.dragOffsetFromTouchPoint = 0;
        this.isDragging = {
            left: false,
            right: false,
            top: false,
            bottom: false,
        };
        this.sliderScrollTrail = [];
        this.currentActiveSlides = [];
        this.SCROLL_RIGHT = 'right';
        this.SCROLL_LEFT = 'left';
        this.events = {
            swipe: null,
            preSwipe: null,
            postSwipe: null,
            initialize: null,
        };
        this.osliderId = 0;
        var o = this;
        /** Slider instance id */
        this.osliderId = osliderId + 1;
        osliderId = this.osliderId;
        o.selector = selector;
        o.$selector = $(selector);
        o.options = $.extend({}, o.defaultOptions, options);
        if (o.options.scrollSlides > o.options.visibleSlides) {
            throw new Error("Constraint scrollSlides <= visibleSlides not upheld");
        }
        o.events = {
            swipe: function (eventData) { return JQuery.Event('oslider.swipe', { oslider: eventData }); },
            preSwipe: function (eventData) { return JQuery.Event('oslider.preswipe', { oslider: eventData }); },
            postSwipe: function (eventData) { return JQuery.Event('oslider.postSwipe', { oslider: eventData }); },
            initialize: function (eventData) { return JQuery.Event('oslider.initialize', { oslider: eventData }); },
        };
        o.bootstrap();
        return o;
    }
    Oslider.prototype.getId = function () {
        return this.osliderId;
    };
    Oslider.prototype.addSlides = function (el, index, before) {
        if (before === void 0) { before = false; }
        var o = this;
        o.addSlide(el, index, before);
    };
    Oslider.prototype.addSlide = function (el, index, before) {
        if (before === void 0) { before = false; }
        console.log('ADD SLIDE');
        var o = this, $els, $targetEl;
        o.isReiniting = true;
        if (typeof el === "string") {
            $els = [$(el)];
        }
        else if (Array.isArray(el)) {
            $els = $(el);
        }
        if (index === undefined) {
            index = o.$slides.length - 1;
        }
        $targetEl = $(o.$slides.get(index));
        if ($targetEl === undefined) {
            throw 'Index out of bound';
        }
        if (index < o.currentSlide && before) {
            // new slides addition invalidates our currentSlide index
            // index + $els.length
            this.currentSlide = index + $els.length;
            console.log('new currentslide', this.currentSlide);
        }
        if (before) {
            $targetEl.before($els);
        }
        else {
            $targetEl.after($els);
        }
        o.reboot();
    };
    Oslider.prototype.removeSlide = function (index) {
        // console.log("removing slide", index);
        var o = this, $targetEl;
        if (index == undefined) {
            throw "No index of slide provided. No slide removed";
        }
        if (index > o.$slides.length) {
            throw "Remove slide index out of bound";
        }
        $targetEl = $(o.$slides.get(index));
        $targetEl.remove();
        o.reboot();
    };
    Oslider.prototype.autoPlay = function () {
        var o = this, autoPlayFn;
        autoPlayFn = function () {
            if (o.currentSlide <= o.numberOfSlides) {
                o.scrollRight();
                o.updateDotNav(o.SCROLL_RIGHT);
            }
        };
        o.timerId = setInterval(autoPlayFn.bind(o), o.options.autoplaySpeed);
    };
    Oslider.prototype.restartAutoPlay = function () {
        console.log('RESTART_AUTO_PLAY()');
        clearInterval(this.timerId);
        this.autoPlay();
    };
    Oslider.prototype.getTrailDirection = function () {
        var len = this.sliderScrollTrail.length, matches = {
            right: 0,
            left: 0,
            top: 0,
            bottom: 0,
        };
        for (var _i = 0, _a = this.sliderScrollTrail; _i < _a.length; _i++) {
            var trailDirection = _a[_i];
            if (trailDirection == SliderScrollTrails.Left) {
                matches.left += 1;
            }
            else if (trailDirection == SliderScrollTrails.Right) {
                matches.right += 1;
            }
            else if (trailDirection == SliderScrollTrails.Top) {
                matches.top += 1;
            }
            else if (trailDirection == SliderScrollTrails.Bottom) {
                matches.bottom += 1;
            }
        }
        if (this.options.orientation == Orientations.HORIZONTAL) {
            return matches.right > matches.left ? SliderScrollTrails.Right : SliderScrollTrails.Left;
        }
        else if (this.options.orientation == Orientations.VERTICAL) {
            return matches.top > matches.left ? SliderScrollTrails.Top : SliderScrollTrails.Bottom;
        }
    };
    Oslider.prototype.getScrollOffsetFor = function (direction) {
        if (direction === void 0) { direction = this.SCROLL_RIGHT; }
        var o = this, offset;
        console.log('mycurrentslide', o.currentSlide);
        if (direction == o.SCROLL_RIGHT) {
            if (o.options.orientation == this.orientations.HORIZONTAL) {
                if (o.options.visibleSlides == 1) {
                    // Disregard o.options.scrollSlides
                    offset = -1 * ((o.currentSlide + 1) * o.sliderContainerDimension.width);
                }
                else {
                    offset = -1 * ((o.currentSlide + 1) * o.options.scrollSlides * o.slideWidth);
                }
            }
            else if (o.options.orientation == this.orientations.VERTICAL) {
                if (o.options.visibleSlides == 1) {
                    // Disregard o.options.scrollSlides
                    offset = -1 * ((o.currentSlide + 1) * o.sliderContainerDimension.height);
                }
                else {
                    offset = -1 * ((o.currentSlide + 1) * o.options.scrollSlides * o.slideWidth);
                }
            }
            return offset;
        }
        else if (direction == o.SCROLL_LEFT) {
            if (o.options.orientation == this.orientations.HORIZONTAL) {
                if (o.options.visibleSlides == 1) {
                    // Disregard scrollSlides
                    offset = -1 * ((o.currentSlide - 1) * o.sliderContainerDimension.width);
                }
                else {
                    offset = -1 * ((o.currentSlide - 1) * o.options.scrollSlides * o.slideWidth);
                }
            }
            else if (o.options.orientation == this.orientations.VERTICAL) {
                if (o.options.visibleSlides == 1) {
                    // Disregard scrollSlides
                    offset = -1 * ((o.currentSlide - 1) * o.sliderContainerDimension.height);
                }
                else {
                    offset = -1 * ((o.currentSlide - 1) * o.options.scrollSlides * o.slideWidth);
                }
            }
            return offset;
        }
    };
    Oslider.prototype.scrollLeft = function (scrollPixels, rescroll) {
        if (rescroll === void 0) { rescroll = false; }
        var o = this, offset;
        o.$selector.trigger(o.events.preSwipe({
            currentSlideEl: o.$currentActiveSlides,
            currentSlideIndex: o.currentSlide,
            swipeDirection: o.SCROLL_LEFT,
            sliderId: o.getId(),
            sliderInstance: o,
        }));
        if (o.currentSlide == 0) {
            return;
        }
        if (scrollPixels !== undefined) {
            if (rescroll == false) {
                scrollPixels = o.sliderOffset + scrollPixels;
            }
            if (o.options.orientation == this.orientations.HORIZONTAL) {
                o.$slider.css({
                    left: scrollPixels
                });
            }
            else if (o.options.orientation == this.orientations.VERTICAL) {
                o.$slider.css({
                    top: scrollPixels
                });
            }
            return;
        }
        // complete scroll
        if (o.options.orientation == this.orientations.HORIZONTAL) {
            offset = o.getScrollOffsetFor('left');
            o.$slider.css({
                left: offset
            });
            o.sliderOffset = offset;
        }
        else if (o.options.orientation == this.orientations.VERTICAL) {
            offset = o.getScrollOffsetFor('left');
            o.$slider.css({
                top: offset
            });
            o.sliderOffset = offset;
        }
        o.currentSlide = o.currentSlide - 1;
        o.updateCurrentActiveSlides();
        o.updateDotNav();
        o.$selector.trigger(o.events.swipe({
            currentSlideEl: o.$currentActiveSlides,
            currentSlideIndex: o.currentSlide,
            swipeDirection: o.SCROLL_LEFT,
            sliderId: o.getId(),
            sliderInstance: o,
        }));
        o.$selector.trigger(o.events.postSwipe({
            currentSlideEl: o.$currentActiveSlides,
            currentSlideIndex: o.currentSlide,
            swipeDirection: o.SCROLL_LEFT,
            sliderId: o.getId(),
            sliderInstance: o,
        }));
    };
    Oslider.prototype.scrollRight = function (scrollPixels, rescroll) {
        if (rescroll === void 0) { rescroll = false; }
        console.log("SCROLL_RIGHT");
        var o = this, offset;
        o.$selector.trigger(o.events.preSwipe({
            currentSlideEl: o.$currentActiveSlides,
            currentSlideIndex: o.currentSlide,
            swipeDirection: o.SCROLL_LEFT,
            sliderId: o.getId(),
            sliderInstance: o,
        }));
        if (o.currentSlide == Math.ceil(o.numberOfSlides / o.options.scrollSlides) - 1) {
            // We've gotten to the last slide, time to start from the very first again.
            if (o.options.infinite) {
                offset = 0;
                if (o.options.orientation == this.orientations.HORIZONTAL) {
                    o.$slider.css({
                        left: offset
                    });
                }
                else if (o.options.orientation == this.orientations.VERTICAL) {
                    o.$slider.css({
                        top: offset
                    });
                }
                o.sliderOffset = offset;
                o.currentSlide = 0;
            }
            return;
        }
        if (scrollPixels !== undefined) {
            if (rescroll == false) {
                scrollPixels = o.sliderOffset - scrollPixels;
            }
            if (o.options.orientation == this.orientations.HORIZONTAL) {
                o.$slider.css({
                    left: scrollPixels
                });
            }
            else if (o.options.orientation == this.orientations.VERTICAL) {
                o.$slider.css({
                    top: scrollPixels
                });
            }
            return;
        }
        // complete scroll
        if (o.options.orientation == this.orientations.HORIZONTAL) {
            offset = o.getScrollOffsetFor('right');
            console.log('new scroll', offset);
            console.log('before current slide', o.currentSlide);
            o.$slider.css({
                left: offset
            });
            o.sliderOffset = offset;
        }
        else if (o.options.orientation == this.orientations.VERTICAL) {
            offset = o.getScrollOffsetFor("right");
            o.$slider.css({
                top: offset
            });
            o.sliderOffset = offset;
        }
        o.currentSlide = o.currentSlide + 1;
        o.updateCurrentActiveSlides();
        o.updateDotNav();
        console.log('after current slide', o.currentSlide);
        o.$selector.trigger(o.events.swipe({
            currentSlideEl: o.$currentActiveSlides,
            currentSlideIndex: o.currentSlide,
            swipeDirection: o.SCROLL_RIGHT,
            sliderId: o.getId(),
            sliderInstance: o,
        }));
        o.$selector.trigger(o.events.postSwipe({
            currentSlideEl: o.$currentActiveSlides,
            currentSlideIndex: o.currentSlide,
            swipeDirection: o.SCROLL_RIGHT,
            sliderId: o.getId(),
            sliderInstance: o,
        }));
        console.log('SCROLL_RIGHT_END');
    };
    Oslider.prototype.setupListeners = function () {
        var o = this;
        o.$selector.on('oslider.swipe', function (event) { return o.options.onSwipeEventHandler.call(o, event); });
        o.$selector.on('oslider.preswipe', function (event) { return o.options.onPreswipeEventHandler.call(o, event); });
        o.$selector.on('oslider.postswipe', function (event) { return o.options.onPostswipeEventHandler.call(o, event); });
        o.$selector.on('oslider.initialize', function (event) { return o.options.onInitilizeEventHandler.call(o, event); });
        if (o.options.dotNav) {
            o.$dotNavWrapper.children().on('click', function () {
                var $dot = $(this), index = $dot.data('index');
                if (index == o.currentSlide) {
                    return;
                }
                if (index < o.currentSlide) {
                    o.currentSlide = index + 1;
                    o.scrollLeft();
                    o.updateDotNav(o.SCROLL_LEFT);
                }
                else if (index > o.currentSlide) {
                    o.currentSlide = index - 1;
                    o.scrollRight();
                    o.updateDotNav(o.SCROLL_RIGHT);
                }
                if (o.options.autoplay) {
                    o.restartAutoPlay();
                }
            });
        }
        o.$arrows.click(function () {
            console.log('arrow clicked start');
            o.handleSlide($(this));
            if (o.options.autoplay) {
                o.restartAutoPlay();
            }
            console.log('arrow click end');
        });
        o.$selector.find('.oslider').on('dragstart touchstart', dragStart);
        o.$selector.find('.oslider').on('dragend touchend', dragEnd);
        o.$selector.find('.oslider').on('drag touchmove', drag);
        function dragStart(event) {
            console.log('working', event);
            o.sliderScrollTrail = [];
            var ghostImg = document.querySelector('.oslider__ghostImg');
            event.originalEvent.dataTransfer.setDragImage(ghostImg, 0, 0);
            event.originalEvent.dataTransfer.setData("text/uri-list", "");
            event.originalEvent.dataTransfer.setData("text/plain", "");
            event.originalEvent.dataTransfer.setData("text/plain", "hello there");
            if (o.options.orientation == o.orientations.HORIZONTAL) {
                o.dragStartPos = event.offsetX;
            }
            else if (o.options.orientation == o.orientations.VERTICAL) {
                o.dragStartPos = event.offsetY;
            }
        }
        function dragEnd(event) {
            if (o.options.orientation == o.orientations.HORIZONTAL) {
                if (o.isDragging.left == true) {
                    if (o.dragOffsetFromTouchPoint > 0) {
                        if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
                            o.scrollRight();
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_LEFT);
                        }
                        else {
                            o.scrollRight(o.sliderOffset, true);
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_LEFT);
                        }
                    }
                    else {
                    }
                }
                else if (o.isDragging.right == true) {
                    if (o.dragOffsetFromTouchPoint > 0) {
                        if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
                            o.scrollLeft();
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_RIGHT);
                        }
                        else {
                            o.scrollLeft(o.sliderOffset, true);
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_RIGHT);
                        }
                    }
                }
                o.isDragging.left = o.isDragging.right = false;
            }
            else if (o.options.orientation == o.orientations.VERTICAL) {
                if (o.isDragging.top == true) {
                    if (o.dragOffsetFromTouchPoint > 0) {
                        if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
                            o.scrollRight();
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_LEFT);
                        }
                        else {
                            o.scrollRight(o.sliderOffset, true);
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_LEFT);
                        }
                    }
                }
                else if (o.isDragging.bottom == true) {
                    if (o.dragOffsetFromTouchPoint > 0) {
                        if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
                            o.scrollLeft();
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_RIGHT);
                        }
                        else {
                            o.scrollLeft(o.sliderOffset, true);
                            o.updateCurrentActiveSlides();
                            o.updateDotNav(o.SCROLL_RIGHT);
                        }
                    }
                }
                o.isDragging.top = o.isDragging.bottom = false;
            }
        }
        function drag(event) {
            var offset;
            if (o.options.orientation == o.orientations.HORIZONTAL) {
                if (event.offsetX > 0 && event.offsetX < o.dragStartPos) {
                    // a left swipe/mouse scroll equiavlent to a left nav click
                    offset = Math.abs(o.dragStartPos) - Math.abs(event.offsetX);
                    o.dragOffsetFromTouchPoint = offset;
                    o.isDragging.left = o.getTrailDirection() == SliderScrollTrails.Left ? true : false;
                    o.isDragging.right = o.getTrailDirection() == SliderScrollTrails.Right ? true : false;
                    o.scrollRight(offset);
                    o.sliderScrollTrail.push(SliderScrollTrails.Left);
                }
                else if (event.offsetX > o.dragStartPos) {
                    // a right swipe/mouse scroll equiavlent to a right nav click
                    o.isDragging.left = o.getTrailDirection() == SliderScrollTrails.Left ? true : false;
                    o.isDragging.right = o.getTrailDirection() == SliderScrollTrails.Right ? true : false;
                    offset = Math.abs(event.offsetX) - Math.abs(o.dragStartPos);
                    o.dragOffsetFromTouchPoint = offset;
                    o.scrollLeft(offset);
                    o.sliderScrollTrail.push(SliderScrollTrails.Right);
                }
            }
            else if (o.options.orientation == o.orientations.VERTICAL) {
                if (event.offsetY > 0 && event.offsetY < o.dragStartPos) {
                    // a top swipe/mouse scroll equiavlent to a top nav click
                    offset = Math.abs(o.dragStartPos) - Math.abs(event.offsetY);
                    o.dragOffsetFromTouchPoint = offset;
                    o.isDragging.top = o.getTrailDirection() == SliderScrollTrails.Top ? true : false;
                    o.isDragging.bottom = o.getTrailDirection() == SliderScrollTrails.Bottom ? true : false;
                    o.scrollRight(offset);
                    o.sliderScrollTrail.push(SliderScrollTrails.Top);
                }
                else if (event.offsetY > o.dragStartPos) {
                    // a bottom swipe/mouse scroll equiavlent to a bottom nav click
                    o.isDragging.top = o.getTrailDirection() == SliderScrollTrails.Top ? true : false;
                    o.isDragging.bottom = o.getTrailDirection() == SliderScrollTrails.Bottom ? true : false;
                    offset = Math.abs(event.offsetY) - Math.abs(o.dragStartPos);
                    if (offset > 0) {
                        o.dragOffsetFromTouchPoint = offset;
                        o.scrollLeft(offset);
                    }
                    o.sliderScrollTrail.push(SliderScrollTrails.Bottom);
                }
            }
        }
        function dragEnter(event) { }
        function dragLeave(event) { }
    };
    Oslider.prototype.handleSlide = function ($arrow) {
        if ($arrow === void 0) { $arrow = null; }
        var o = this;
        if ($arrow === null) {
            o.scrollLeft();
            o.updateDotNav(o.SCROLL_LEFT);
        }
        if ($arrow.hasClass('oslider__arrow--left') || $arrow.hasClass('oslider__arrow--top')) {
            o.scrollLeft();
            // o.updateDotNav(o.SCROLL_LEFT);
        }
        if ($arrow.hasClass('oslider__arrow--right') || $arrow.hasClass('oslider__arrow--bottom')) {
            o.scrollRight();
            // o.updateDotNav(o.SCROLL_RIGHT);
        }
        // o.updateCurrentActiveSlides();
    };
    Oslider.prototype.reboot = function () {
        console.log("REBOOT");
        // this.currentSlide = 0;
        this.bootstrap();
    };
    Oslider.prototype.bootstrap = function () {
        var o = this, height, width;
        o.prepareSlider();
        o.numberOfSlides = o.$selector.find('.oslider__slide').length;
        o.setupNavigations();
        o.setupDotNavigation();
        if (o.options.orientation == o.orientations.HORIZONTAL) {
            o.$slider.addClass('oslider--horizontal').width(o.sliderDimension.length).height(o.sliderDimension.width);
            if (o.options.visibleSlides == 1) {
                width = o.$selector.width();
            }
            else {
                width = o.sliderContainerDimension.width / o.options.visibleSlides;
            }
            o.slideWidth = width;
            o.$slides.each(function () {
                var $slide = $(this);
                if ($slide.is('img')) {
                    $slide.attr('width', width);
                    $slide.attr('height', o.$selector.height());
                }
                else {
                    $slide.outerWidth(width); // outerWidth covers the slide's content, padding, and margin.
                }
            });
        }
        else if (o.options.orientation == o.orientations.VERTICAL) {
            o.$slider.addClass('oslider--vertical');
            o.$slider.height(o.sliderDimension.length).width(o.sliderDimension.width);
            if (o.options.visibleSlides == 1) {
                height = o.$selector.height();
            }
            else {
                height = o.sliderContainerDimension.height / o.options.visibleSlides;
            }
            o.slideWidth = height;
            o.$slides.each(function () {
                var $slide = $(this);
                if ($slide.is('img')) {
                    $slide.attr('height', height);
                    $slide.attr('width', o.$selector.width());
                }
                else {
                    $slide.outerHeight(height); // outerHeight covers the slide's content, padding, and margin.
                }
            });
        }
        console.log('about to run');
        o.updateCurrentActiveSlides();
        o.updateDotNav();
        console.log("about to run end", o.currentActiveSlides);
        if (o.options.autoplay) {
            o.autoPlay();
        }
        o.setupListeners();
        o.$selector.trigger(o.events.initialize({
            currentSlideEl: o.$currentActiveSlides,
            currentSlideIndex: o.currentSlide,
            swipeDirection: o.SCROLL_LEFT,
            sliderId: o.getId(),
            sliderInstance: o,
        }));
    };
    Oslider.prototype.prepareSlider = function () {
        var o = this;
        o.prepareSlides();
        o.$slider = o.$selector.find('.oslider');
        o.$slides = o.$selector.find('.oslider').children();
        o.sliderContainerDimension.width = o.$selector.width();
        o.sliderContainerDimension.height = o.$selector.height();
        var ghostImg = $('<img src="" class="oslider__ghostImg" style="width: 0.1px; height: 0.1px;">');
        o.$selector.append(ghostImg);
    };
    Oslider.prototype.prepareSlides = function () {
        var o = this, $oslider, $osliderInnerContainer;
        if (o.$slider === undefined) {
            $oslider = $('<div class="oslider" draggable="true">');
            o.$selector.addClass('oslider-container').data('oslider-id', o.osliderId);
            $oslider.append(o.$selector.children().addClass('oslider__slide'));
            $osliderInnerContainer = $('<div class="oslider-container__inner">');
            $osliderInnerContainer.append($oslider);
            o.$selector.append($osliderInnerContainer);
            o.$selector = $(document).find(o.selector);
        }
        else {
            o.$slides = o.$selector.find('.oslider').children().addClass('oslider__slide');
        }
    };
    Oslider.prototype.setupNavigations = function () {
        var o = this, $sliderArrowsMarkup, offset;
        if (o.isReiniting)
            return;
        if (o.options.orientation == o.orientations.HORIZONTAL) {
            $sliderArrowsMarkup = "\n\t\t\t<div class=\"oslider__arrow oslider__arrow--left\"><i class=\"fa fa-arrow-left\"></i></div>\n\t\t\t<div class=\"oslider__arrow oslider__arrow--right\"><i class=\"fa fa-arrow-right\"></i></div>\n\t\t\t";
            o.$selector.append($sliderArrowsMarkup);
            offset = (o.$selector.height() / 2) - o.$selector.find('.oslider__arrow').height();
            o.$selector.find('.oslider__arrow--left').css({ top: offset });
            o.$selector.find('.oslider__arrow--right').css({ top: offset });
        }
        else if (o.options.orientation == o.orientations.VERTICAL) {
            $sliderArrowsMarkup = "\n\t\t\t<div class=\"oslider__arrow oslider__arrow--top\"><i class=\"fa fa-arrow-up\"></i></div>\n\t\t\t<div class=\"oslider__arrow oslider__arrow--bottom\"><i class=\"fa fa-arrow-down\"></i></div>\n\t\t\t";
            o.$selector.append($sliderArrowsMarkup);
            offset = (o.$selector.width() / 2) - o.$selector.find('.oslider__arrow').width();
            o.$selector.find('.oslider__arrow--bottom ').css({ left: offset });
            o.$selector.find('.oslider__arrow--top').css({ left: offset });
        }
        if (o.options.showNav) {
            o.$selector.find('.oslider__arrow').addClass('oslider__arrow--show');
        }
        o.$arrows = o.$selector.find('.oslider__arrow');
    };
    Oslider.prototype.setupDotNavigation = function () {
        var o = this, $dotNavWrapper, dotNavItemsHtml, $dotNavItems;
        if (o.options.dotNav) {
            if (o.options.scrollSlides > 1) {
                length = Math.ceil(o.numberOfSlides / o.options.scrollSlides);
            }
            else {
                length = o.numberOfSlides;
            }
            dotNavItemsHtml = " ";
            for (var i = 0; i < length; i++) {
                dotNavItemsHtml += "<span class=\"oslider__dotNav__item\" data-index=" + i + "></span>";
            }
            $dotNavItems = $(dotNavItemsHtml);
            if (!o.isReiniting) {
                $dotNavWrapper = $("<div class=\"oslider__dotNav\"></div>");
                $dotNavWrapper.append($dotNavItems);
                o.$selector.append($dotNavWrapper);
            }
            else {
                o.$dotNavWrapper.children().remove();
                o.$dotNavWrapper.append($dotNavItems);
            }
            o.$dotNavWrapper = o.$selector.find('.oslider__dotNav');
            if (o.options.orientation == o.orientations.HORIZONTAL) {
                o.$dotNavWrapper.addClass('oslider__dotNav--horizontal');
            }
            else if (o.options.orientation == o.orientations.VERTICAL) {
                o.$dotNavWrapper.addClass('oslider__dotNav--vertical');
            }
        }
    };
    Oslider.prototype.updateDotNav = function (slideDirection) {
        console.log('UPDATEDOTNAV', this.currentSlide);
        var o = this;
        if (!o.options.dotNav)
            return;
        var activeDotNavIndices = [];
        for (var i = o.currentSlide; i < (o.currentSlide + o.options.visibleSlides); i++) {
            activeDotNavIndices.push(i);
        }
        console.log('ACTIVE_DOT_INDEX', activeDotNavIndices);
        o.$dotNavWrapper.children().each(function () {
            var $dot = $(this), index = $dot.data('index');
            if (activeDotNavIndices.indexOf(index) !== -1) {
                $dot.addClass('oslider__dotNav__item--active');
            }
            else {
                $dot.removeClass('oslider__dotNav__item--active');
            }
        });
    };
    Oslider.prototype.updateCurrentActiveSlides = function () {
        var o = this;
        o.currentActiveSlides = [];
        o.$currentActiveSlides = [];
        for (var i = o.currentSlide; i < (o.currentSlide + o.options.visibleSlides); i++) {
            o.currentActiveSlides.push(i);
        }
        o.$slides.each(function (index) {
            var $slide = $(this);
            if (o.currentActiveSlides.indexOf(index) !== -1) {
                o.$currentActiveSlides.push($slide);
                $slide.addClass('oslider__slide--active');
            }
            else {
                $slide.removeClass('oslider__slide--active');
            }
        });
    };
    return Oslider;
}());
exports.Oslider = Oslider;
jQuery.fn.extend({
    oslider: function (options) {
        this.each(function () {
            return new Oslider(this, options);
        });
    }
});
//# sourceMappingURL=oslider.js.map