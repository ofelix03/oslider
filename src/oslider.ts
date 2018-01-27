
import * as JQuery from 'jquery';

let name = 'Felix';
let $ = JQuery;

export 	enum Orientations {
	HORIZONTAL = "horizontal",
	VERTICAL = "vertical",
};

export enum DragDirections {
	Left = "left",
	Right = "right",
	Top = "top",
	Bottom = "bottom"
};

export enum SliderScrollTrails {
	Left = "left",
	Right = "right",
	Top= "top",
	Bottom = "bottom",
};

export interface DefaultOptions {
	visibleSlides: number;
	scrollSlides: number;
	orientation: Orientations;
	slideSize: null|number; // sliderSize = null; means auto, use orientation to determin slide size(i.e. setting it's width or height)
	scrollPos: number; 
	sliderWidth: number;
	sliderHeight: string;
	slideTo: number; // the slide to move top
	showNav: boolean;
	dotNav: boolean;
	autoplay: boolean;
	autoplaySpeed: number;
	infinite: boolean;	
	onSwipeEventHandler: any;
	onPreswipeEventHandler: any;
	onPostswipeEventHandler: any;
	onInitilizeEventHandler: any; 
};

export interface Events  {
	swipe: any;
	preSwipe: any;
	postSwipe: any;
	initialize: any,
}

let oslider_id = 0;
export class Oslider {
	Events:Events;

	id:number;
	selector:string;
	$selector: any;
	$dotNavWrapper: any;
	$oslider: any;
	$slider: any;
	$slides: any;
	$arrows: any;
	currentSlide:number = 0;
	$currentActiveSlides = [];
	$currentSlide: any;
	numberOfSlides:number;
	sliderContainerDimension = {
		height: 200,
		width: 200,
	};
	isReiniting = false;
	SLIDER_LENGTH = 999 // the default length of the slider depending on it's orientation [HORIZONTAL | VERTICAL]
	sliderDimension = {
		width: '100%',
		length: this.SLIDER_LENGTH
	};
	slideWidth = 0;
	orientations = {
		HORIZONTAL: 'horizontal',
		VERTICAL: 'vertical',
	};
	options:any;
	defaultOptions: any = {
		visibleSlides: 1,
		scrollSlides: 1,
		orientation: this.orientations.HORIZONTAL,
		slideSize: null, // sliderSize = null; means auto, use orientation to determin slide size(i.e. setting it's width or height)
		scrollPos: 0, 
		sliderWidth: 999,
		sliderHeight: "auto",
		slideTo: 0, // the slide to move to
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
	dragStartPos: number|null = null;
	sliderOffset:number = 0;
	dragOffsetFromTouchPoint:number = 0;
	isDragging = {
		left: false,
		right: false,
		top: false,
		bottom: false,
	};
	sliderScrollTrail:SliderScrollTrails[] = []; 
	currentActiveSlides:number[] = []
	SCROLL_RIGHT = 'right';
	SCROLL_LEFT = 'left';
	timerId: number;
	events: Events = {
		swipe: null,
		preSwipe: null,
		postSwipe: null,
		initialize: null,		
	};
	oslider_id = 0;
	
	constructor(selector:any, options: {}) {
		let o = this;
		/** Slider instance id */
		this.oslider_id = oslider_id  + 1;
		oslider_id = this.oslider_id;
		o.selector = selector;
		o.$selector = $(selector);
		o.options = $.extend({}, o.defaultOptions, options);

		if (o.options.scrollSlides > o.options.visibleSlides) {
			throw new Error("Constraint scrollSlides <= visibleSlides not upheld");
		}
		o.events = {
			swipe: (eventData) => JQuery.Event('oslider.swipe', {oslider: eventData}),
			preSwipe: (eventData) => JQuery.Event('oslider.preswipe', {oslider: eventData}),
			postSwipe: (eventData) => JQuery.Event('oslider.initialize', {oslider: eventData}),			
			initialize: (eventData) => JQuery.Event('oslider.initialize', {oslider: eventData}),
		}	
		o.bootstrap();

		return this;
	}	
	getId(): number {
		return this.oslider_id;
	}

	addSlide(el: any, index:number, before:boolean = false) {
		let o = this;
		let $el, $targetEl;
		o.isReiniting = true;
		if (typeof el === "string")  {
			$el = $(el);
		} else {
			$el = el;
		}
		console.log("adding slide", el, index);

		if (index !== undefined) {
			$targetEl = $(o.$slides.get(index));
		} else {
			// intent is to put new slide at the end of slides
			// get last slide in the current $slides list
			$targetEl = o.$slider.last();
		}

		if ($targetEl === undefined) {
			throw  'Index out of bound';
		}

		if (before) {
			$targetEl.before($el);
		} else {
			$targetEl.after($el);
		}
		o.reboot();
	}


	removeSlide(index:number) {
		console.log("removing slide", index);
		let o = this,
		$targetEl;

		if (index == undefined) {
			throw "No index of slide provided. No slide removed";
		}
		console.log("length", o.$slides.length);
		if (index > o.$slides.length) {
			throw "Remove slide index out of bound"; 
		}

		$targetEl = $(o.$slides.get(index));
		$targetEl.remove();
		console.log("number of slides before boostrap", o.numberOfSlides);
		o.reboot();
		console.log("number of slides after boostrap", o.numberOfSlides);
	}

	autoPlay() {
		let o = this, autoPlayFn;
		autoPlayFn = () => {
			if (o.currentSlide <= o.numberOfSlides) {
				o.scrollRight()
				o.updateDotNav(o.SCROLL_RIGHT);
			} 
		}
		o.timerId = setInterval(autoPlayFn.bind(o), o.options.autoplaySpeed);
	}

	restartAutoPlay()  {
		clearInterval(this.timerId);
		this.autoPlay();
	}

	getTrailDirection() {
		let len = this.sliderScrollTrail.length,
		matches = {
			right: 0,
			left: 0,
			top: 0,
			bottom: 0,
		};

		for (let trailDirection of this.sliderScrollTrail) {
			if (trailDirection == SliderScrollTrails.Left) {
				matches.left += 1;
			}  else if (trailDirection == SliderScrollTrails.Right) {
				matches.right += 1;
			} else if (trailDirection == SliderScrollTrails.Top) {
				matches.top += 1;
			} else if (trailDirection == SliderScrollTrails.Bottom) {
				matches.bottom += 1;
			}
		}

		if (this.options.orientation == Orientations.HORIZONTAL) {
			return matches.right > matches.left ? SliderScrollTrails.Right : SliderScrollTrails.Left;
		} else if (this.options.orientation == Orientations.VERTICAL) {
			return matches.top > matches.left ? SliderScrollTrails.Top : SliderScrollTrails.Bottom;
		}
	}

	getScrollOffsetFor(direction=this.SCROLL_RIGHT) {
		let o = this;
		let offset;

		if (direction == "right") {
			if (o.options.orientation == this.orientations.HORIZONTAL) {
				if (o.options.visibleSlides == 1) {
					// Disregard o.options.scrollSlides
					offset = -1 * ((o.currentSlide + 1) * o.sliderContainerDimension.width);
				} else  {
					offset = -1 * ((o.currentSlide + 1) * o.options.scrollSlides * o.slideWidth);
				}
			} else if (o.options.orientation == this.orientations.VERTICAL) {
				if (o.options.visibleSlides == 1) {
					// Disregard o.options.scrollSlides
					offset = -1 * ((o.currentSlide + 1) * o.sliderContainerDimension.height);
				} else {
					offset =  -1 * ((o.currentSlide + 1) * o.options.scrollSlides *  o.slideWidth);
				}
			}
			return offset;
		} else if (direction == o.SCROLL_LEFT) {
			if (o.options.orientation == this.orientations.HORIZONTAL) {
				if (o.options.visibleSlides == 1) {
					// Disregard scrollSlides
					offset = -1 * ((o.currentSlide - 1) * o.sliderContainerDimension.width);
				} else {
					offset = -1 * ((o.currentSlide - 1) * o.options.scrollSlides * o.slideWidth);
				}
			} else if (o.options.orientation == this.orientations.VERTICAL) {
				if (o.options.visibleSlides == 1) {
					// Disregard scrollSlides
					offset = -1 * ((o.currentSlide - 1) * o.sliderContainerDimension.height);
				} else {
					offset = -1 * ((o.currentSlide - 1) * o.options.scrollSlides * o.slideWidth);
				}
			}
			return offset;
		}
	}

	scrollLeft(scrollPixels?:number, rescroll:boolean = false) {
		let o = this;
		o.$selector.trigger(
			o.events.preSwipe({
				currentSlideEl: o.$currentActiveSlides,
				currentSlideIndex: o.currentSlide,
				swipeDirection: o.SCROLL_LEFT,	
				sliderId: o.getId(),
			}));

		if (o.currentSlide == 0) {
			return;
		}

		if (scrollPixels !== undefined) {
			if (rescroll == false) {
				scrollPixels = o.sliderOffset + scrollPixels
			}

			if (o.options.orientation == this.orientations.HORIZONTAL) {
				o.$slider.css({
					left: scrollPixels
				});	
			} else if (o.options.orientation == this.orientations.VERTICAL) {
				o.$slider.css({
					top: scrollPixels
				});	
			}
			return;
		}
		// complete scrolls
		if (o.options.orientation == this.orientations.HORIZONTAL) {
			let offset = o.getScrollOffsetFor('left');
			o.$slider.css({
				left: offset
			});	
			o.sliderOffset = offset;	
		} else if (o.options.orientation == this.orientations.VERTICAL) {
			let offset = o.getScrollOffsetFor('left');
			o.$slider.css({
				top: offset
			});		
			o.sliderOffset = offset;
		}
		o.currentSlide = o.currentSlide - 1;
		o.updateCurrentActiveSlides();

		o.$selector.trigger(
			o.events.swipe({
				currentSlideEl: o.$currentActiveSlides,
				currentSlideIndex: o.currentSlide,
				swipeDirection: o.SCROLL_LEFT,
				sliderId: o.getId(),
			}));

		o.$selector.trigger(
			o.events.postSwipe({
				currentSlideEl: o.$currentActiveSlides,
				currentSlideIndex: o.currentSlide,
				swipeDirection: o.SCROLL_LEFT,
				sliderId: o.getId(),
			}));
	}

	scrollRight(scrollPixels?:number, rescroll:boolean=false) {
		let o = this, 
		offset;

		o.$selector.trigger(
			o.events.preSwipe({
				currentSlideEl: o.$currentActiveSlides,
				currentSlideIndex: o.currentSlide,
				swipeDirection: o.SCROLL_LEFT,
				sliderId: this.getId(),
			}));

		if (o.currentSlide == Math.ceil(o.numberOfSlides / o.options.scrollSlides) - 1) {
			// We've gotten to the last slide, time to start from the very first again.
			if (o.options.infinite) {
				offset = 0;
				if (o.options.orientation == this.orientations.HORIZONTAL) {
					o.$slider.css({
						left: offset
					});
				} else if (o.options.orientation == this.orientations.VERTICAL) {
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
			} else if (o.options.orientation == this.orientations.VERTICAL) {
				o.$slider.css({
					top: scrollPixels
				});	
			}
			return;
		}

		// complete scrolls
		if (o.options.orientation == this.orientations.HORIZONTAL) {
			offset = o.getScrollOffsetFor('right');
			o.$slider.css({
				left: offset
			});	
			o.sliderOffset = offset;
		} else if (o.options.orientation == this.orientations.VERTICAL) {
			offset = o.getScrollOffsetFor("right");
			o.$slider.css({
				top: offset
			});	
			o.sliderOffset = offset;
		}
		o.currentSlide = o.currentSlide + 1;
		o.updateCurrentActiveSlides();

		o.$selector.trigger(
			o.events.swipe({
				currentSlideEl: o.$currentActiveSlides,
				currentSlideIndex: o.currentSlide,
				swipeDirection: o.SCROLL_RIGHT,
				sliderId: this.getId(),
			}));
		
		o.$selector.trigger(
			o.events.postSwipe({
				currentSlideEl: o.$currentActiveSlides,
				currentSlideIndex: o.currentSlide,
				swipeDirection: o.SCROLL_RIGHT,	
				sliderId: this.getId(),
			}));
	}

	setupListeners() {
		let o = this;

		o.$selector.on('oslider.swipe', (event) => o.options.onSwipeEventHandler.call(o, event));
		o.$selector.on('oslider.preswipe', (event) => o.options.onPreswipeEventHandler.call(o, event));
		o.$selector.on('oslider.postswipe', (event) => o.options.onPostswipeEventHandler.call(o, event));
		o.$selector.on('oslider.initialize', (event) => o.options.onInitilizeEventHandler.call(o, event));

		if (o.options.dotNav) {
			o.$dotNavWrapper.children().on('click', function(){
				let $dot = $(this),
				index = $dot.data('index');

				if (index != o.currentSlide) {
					if (index < o.currentSlide) {
						o.currentSlide =  index + 1;
						o.scrollLeft();
						o.updateDotNav(o.SCROLL_LEFT);
					} else {
						o.currentSlide = index - 1;
						o.scrollRight();
						o.updateDotNav(o.SCROLL_RIGHT);
					}

					if (o.options.autoplay) {
						o.restartAutoPlay();
					}
				}
			});
		}

		o.$arrows.click(function() {
			o.handleSlide($(this));
			if (o.options.autoplay) {
				o.restartAutoPlay();
			}
		});

		o.$selector.find('.oslider').on('dragstart', dragStart)
		o.$selector.find('.oslider').on('dragend', dragEnd)
		o.$selector.find('.oslider').on('drag', drag)

		function dragStart(event) {
			o.sliderScrollTrail = []
			let ghostImg = document.querySelector('.oslider__ghostImg');
			event.originalEvent.dataTransfer.setDragImage(ghostImg, 0, 0)

			event.originalEvent.dataTransfer.setData("text/uri-list", "");
			event.originalEvent.dataTransfer.setData("text/plain", "");
			event.originalEvent.dataTransfer.setData("text/plain", "hello there");
			if (o.options.orientation == o.orientations.HORIZONTAL) {
				o.dragStartPos = event.offsetX;			
			} else if (o.options.orientation == o.orientations.VERTICAL) {
				o.dragStartPos = event.offsetY;
			}
		}

		function dragEnd(event) {
			if (o.options.orientation == o.orientations.HORIZONTAL) {
				if (o.isDragging.left == true) { // a mouse swipe to the left
					if (o.dragOffsetFromTouchPoint > 0) {
						if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
							o.scrollRight();
							o.updateCurrentActiveSlides();
							o.updateDotNav(o.SCROLL_LEFT);
						} else {
							o.scrollRight(o.sliderOffset, true);
							o.updateDotNav(o.SCROLL_LEFT);
						}
					} else {

					}
				} else if (o.isDragging.right == true) { // a mouse swipe to the right
					if (o.dragOffsetFromTouchPoint > 0) {
						if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
							o.scrollLeft();
							o.updateCurrentActiveSlides();
							o.updateDotNav(o.SCROLL_RIGHT);
						} else {
							o.scrollLeft(o.sliderOffset, true);
							o.updateDotNav(o.SCROLL_RIGHT);
						}
					}
				} 
				o.isDragging.left = o.isDragging.right = false;
			} else if (o.options.orientation == o.orientations.VERTICAL) {
				if (o.isDragging.top == true) { // a mouse swipe to the top
					if (o.dragOffsetFromTouchPoint > 0) {
						if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
							o.scrollRight();
							o.updateDotNav(o.SCROLL_LEFT);
						} else {
							o.scrollRight(o.sliderOffset, true);
							o.updateDotNav(o.SCROLL_LEFT);
						}
					} 
			} else if (o.isDragging.bottom == true) { // a mouse swipe to the bottom
				if (o.dragOffsetFromTouchPoint > 0) {
					if (o.dragOffsetFromTouchPoint > (o.slideWidth / 4)) {
						o.scrollLeft();
						o.updateCurrentActiveSlides();
						o.updateDotNav(o.SCROLL_RIGHT);
					} else {
						o.scrollLeft(o.sliderOffset, true);
						o.updateDotNav(o.SCROLL_RIGHT);
					}
				}
			} 
			o.isDragging.top = o.isDragging.bottom = false;
		}
	}


	function drag(event) {
		let offset;
		if (o.options.orientation == o.orientations.HORIZONTAL) {
			if (event.offsetX > 0 && event.offsetX < o.dragStartPos) { 
					// a left swipe/mouse scroll equiavlent to a left nav click
					offset = Math.abs(o.dragStartPos) - Math.abs(event.offsetX);
					o.dragOffsetFromTouchPoint = offset;
					o.isDragging.left = o.getTrailDirection() == SliderScrollTrails.Left ? true: false;
					o.isDragging.right = o.getTrailDirection() == SliderScrollTrails.Right ? true: false;
					o.scrollRight(offset);
					o.sliderScrollTrail.push(SliderScrollTrails.Left)
				} else if (event.offsetX > o.dragStartPos) { 	
					// a right swipe/mouse scroll equiavlent to a right nav click
					o.isDragging.left = o.getTrailDirection() == SliderScrollTrails.Left ? true: false;
					o.isDragging.right = o.getTrailDirection() == SliderScrollTrails.Right ? true: false;
					offset = Math.abs(event.offsetX) - Math.abs(o.dragStartPos);
					o.dragOffsetFromTouchPoint = offset;
					o.scrollLeft(offset);
					o.sliderScrollTrail.push(SliderScrollTrails.Right);
				}
			} else if (o.options.orientation == o.orientations.VERTICAL) {
				if (event.offsetY > 0 && event.offsetY < o.dragStartPos) { 
					// a top swipe/mouse scroll equiavlent to a top nav click
					offset = Math.abs(o.dragStartPos) - Math.abs(event.offsetY);
					o.dragOffsetFromTouchPoint = offset;
					o.isDragging.top = o.getTrailDirection() == SliderScrollTrails.Top ? true: false;
					o.isDragging.bottom = o.getTrailDirection() == SliderScrollTrails.Bottom ? true: false;
					o.scrollRight(offset);
					o.sliderScrollTrail.push(SliderScrollTrails.Top);
				} else if (event.offsetY > o.dragStartPos) { 
					// a bottom swipe/mouse scroll equiavlent to a bottom nav click
					o.isDragging.top = o.getTrailDirection() == SliderScrollTrails.Top ? true: false;
					o.isDragging.bottom = o.getTrailDirection() == SliderScrollTrails.Bottom ? true: false;
					offset = Math.abs(event.offsetY) - Math.abs(o.dragStartPos);
					if (offset >  0) {
						o.dragOffsetFromTouchPoint = offset;
						o.scrollLeft(offset);
					}
					o.sliderScrollTrail.push(SliderScrollTrails.Bottom);
				}
			}
		}

		function dragEnter(event) {}

		function dragLeave(event) {}
	}

	handleSlide($arrow = null) {
		let o = this; 
		if ($arrow === null) {
			o.scrollLeft();
			o.updateDotNav(o.SCROLL_LEFT);
		} 

		if ($arrow.hasClass('oslider__arrow--left') || $arrow.hasClass('oslider__arrow--top')) {
			o.scrollLeft();	
			o.updateDotNav(o.SCROLL_LEFT);
		} 

		if ($arrow.hasClass('oslider__arrow--right') || $arrow.hasClass('oslider__arrow--bottom')) {
			o.scrollRight();
			o.updateDotNav(o.SCROLL_RIGHT);
		}
		o.updateCurrentActiveSlides();
	}
	reboot() {
		this.currentSlide = 0;
		this.bootstrap();
	}

	bootstrap() {
		console.log("bootstrapping");
		let o = this, height, width;

		o.prepareSlider();
		o.numberOfSlides = o.$selector.find('.oslider__slide').length;
		o.setupNavigations();
		o.setupDotNavigation();

		if (o.options.orientation == o.orientations.HORIZONTAL) {
			o.$slider.addClass('oslider--horizontal').width(o.sliderDimension.length).height(o.sliderDimension.width);
			if (o.options.visibleSlides == 1) {
				width = o.$selector.width();
			} else {
				width = o.sliderContainerDimension.width / o.options.visibleSlides;
			}
			o.slideWidth = width;
			o.$slides.each(function(){
				let $slide = $(this);
				if ($slide.is('img')) {
					$slide.attr('width', width);
					$slide.attr('height', o.$selector.height());
				} else {
					$slide.outerWidth(width); // outerWidth covers the slide's content, padding, and margin.
				}
			});
		} else if (o.options.orientation == o.orientations.VERTICAL) {
			o.$slider.addClass('oslider--vertical');
			o.$slider.height(o.sliderDimension.length).width(o.sliderDimension.width)
			if (o.options.visibleSlides == 1) {
				height = o.$selector.height();
			} else {
				height = o.sliderContainerDimension.height / o.options.visibleSlides;
			}
			o.slideWidth = height;
			o.$slides.each(function(){
				let $slide = $(this);
				if ($slide.is('img')) {
					$slide.attr('height', height);
					$slide.attr('width', o.$selector.width());
				} else {
					$slide.outerHeight(height); // outerHeight covers the slide's content, padding, and margin.
				}
			});
		}
		o.setupListeners();
		o.updateCurrentActiveSlides();
		o.updateDotNav();
		if (o.options.autoplay) {
			o.autoPlay();
		}

		// oslider is setup and initialized 
		o.$selector.trigger(
			o.events.initialize({
				currentSlideEl: o.$currentActiveSlides,
				currentSlideIndex: o.currentSlide,
				swipeDirection: o.SCROLL_LEFT,
				sliderId: this.id,
			}));

		console.log("after boostrap", o.numberOfSlides)
	}

	prepareSlider() {
		let o = this;

		o.prepareSlides()
		o.$slider = o.$selector.find('.oslider');
		o.$slides = o.$selector.find('.oslider').children();
		o.sliderContainerDimension.width = o.$selector.width();
		o.sliderContainerDimension.height = o.$selector.height();
		let ghostImg = $('<img src="" class="oslider__ghostImg" style="width: 0.1px; height: 0.1px;">')
		o.$selector.append(ghostImg);
	}

	prepareSlides() {
		let o = this, 
		$oslider, 
		$osliderInnerContainer;
		console.log("slider", o.$slider);
		if (o.$slider === undefined) {
			console.log("first tagging");
			$oslider = $('<div class="oslider" draggable="true">');
			o.$selector.addClass('oslider-container').data('oslider-id', o.oslider_id);
			$oslider.append(o.$selector.children().addClass('oslider__slide'))
			$osliderInnerContainer = $('<div class="oslider-container__inner">');
			$osliderInnerContainer.append($oslider);
			o.$selector.append($osliderInnerContainer);
			o.$selector = $(document).find(o.selector);
		} else {
			o.$slides = o.$selector.find('.oslider').children().addClass('oslider__slide');
		}
	}

	setupNavigations() {
		let o = this, 
		$sliderArrowsMarkup,
		offset;

		if (o.isReiniting) 
			return;

		if (o.options.orientation == o.orientations.HORIZONTAL) {
			$sliderArrowsMarkup = `
			<div class="oslider__arrow oslider__arrow--left"><i class="fa fa-arrow-left"></i></div>
			<div class="oslider__arrow oslider__arrow--right"><i class="fa fa-arrow-right"></i></div>
			`;
			o.$selector.append($sliderArrowsMarkup);
			offset = (o.$selector.height() / 2) -  o.$selector.find('.oslider__arrow').height();
			o.$selector.find('.oslider__arrow--left').css({top: offset});
			o.$selector.find('.oslider__arrow--right').css({top: offset});
		} else if (o.options.orientation == o.orientations.VERTICAL) {
			$sliderArrowsMarkup = `
			<div class="oslider__arrow oslider__arrow--top"><i class="fa fa-arrow-up"></i></div>
			<div class="oslider__arrow oslider__arrow--bottom"><i class="fa fa-arrow-down"></i></div>
			`;
			o.$selector.append($sliderArrowsMarkup);
			offset = (o.$selector.width() / 2) -  o.$selector.find('.oslider__arrow').width();
			o.$selector.find('.oslider__arrow--bottom ').css({left: offset});
			o.$selector.find('.oslider__arrow--top').css({left: offset});
		}

		if (o.options.showNav) {
			o.$selector.find('.oslider__arrow').addClass('oslider__arrow--show');
		}
		o.$arrows = o.$selector.find('.oslider__arrow');
	}

	setupDotNavigation() {
		let o = this, 
		$dotNavWrapper,
		dotNavItemsHtml,
		$dotNavItems;

		if (o.options.dotNav) {

			if (o.options.scrollSlides > 1) {
				length = o.numberOfSlides / o.options.scrollSlides;
			} else {
				length = o.numberOfSlides;
			}
			dotNavItemsHtml = ` `;
			for (let i = 0; i < length; i++) {
				dotNavItemsHtml += `<span class="oslider__dotNav__item" data-index=${i}></span>`;
			}
			$dotNavItems = $(dotNavItemsHtml);

			if ( ! o.isReiniting) {
				$dotNavWrapper = $(`<div class="oslider__dotNav"></div>`);
				$dotNavWrapper.append($dotNavItems);
				o.$selector.append($dotNavWrapper);
			} else {
				o.$dotNavWrapper.children().remove();
				o.$dotNavWrapper.append($dotNavItems)
			}
			
			o.$dotNavWrapper = o.$selector.find('.oslider__dotNav');
			if (o.options.orientation == o.orientations.HORIZONTAL) {
				o.$dotNavWrapper.addClass('oslider__dotNav--horizontal');
			} else if (o.options.orientation == o.orientations.VERTICAL) {
				o.$dotNavWrapper.addClass('oslider__dotNav--vertical');
			}
		}
	}

	updateDotNav(slideDirection?:any) {
		let o = this;

		if (!o.options.dotNav) 
			return;

		let activeDotNavIndex;
		if (slideDirection === undefined) {
			activeDotNavIndex = 0;
		} else {
			activeDotNavIndex = o.currentSlide;
		}

		console.log('hey', o.currentSlide);

		o.$dotNavWrapper.children().each(function() {
			let $dot = $(this),
			index = $dot.data('index');
			if (index == activeDotNavIndex) {
				$dot.addClass('oslider__dotNav__item--active');
			} else {
				$dot.removeClass('oslider__dotNav__item--active');
			}
		});
	}

	updateCurrentActiveSlides() {
		console.log("updatecurrenslide()");
		let o = this;
		o.currentActiveSlides = [];
		o.$currentActiveSlides = [];
		console.log("currntSlide", o.currentSlide);
		for (let i = o.currentSlide; i < (o.currentSlide + o.options.scrollSlides); i++) {
			o.currentActiveSlides.push(i)
		}

		console.log('active index', o.currentActiveSlides);
		o.$slides.each(function(index){
			let $slide = $(this);
			let isActive = o.currentActiveSlides.filter((el => el == index)).length;
			if (isActive) {
				o.$currentActiveSlides.push($slide);
				$slide.addClass('oslider__slide--active');
			} else {
				$slide.removeClass('oslider__slide--active');
			}
		});
		console.log("currentslides",  o.$currentActiveSlides);
	}	
}

interface JQuery {
	oslider(options?:any): JQuery
}

jQuery.fn.extend({
	oslider: function(options:any) {
		this.each(function(){
			return new Oslider(this, options);
		});
	}
});
