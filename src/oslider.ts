import * as JQuery from "jquery";

let $ = JQuery;

export enum Orientations {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical"
}

export enum DragDirections {
  Left = "left",
  Right = "right",
  Top = "top",
  Bottom = "bottom"
}

export enum SliderScrollTrails {
  Left = "left",
  Right = "right",
  Top = "top",
  Bottom = "bottom"
}

export interface DefaultOptions {
  visibleSlides: number;
  scrollSlides: number;
  orientation: Orientations;
  slideSize: null | number; // sliderSize = null; means auto, use orientation to determin slide size(i.e. setting it's width or height)
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
}

export interface Events {
  swipe: any;
  preSwipe: any;
  postSwipe: any;
  initialize: any;
}

let osliderId = 0;
export class Oslider {
  Events: Events;

  id: number;
  selector: string;
  $selector: any = null;
  $dotNavWrapper: any;
  $oslider: any = null;
  $slider: any = null;
  $slides: any = null;
  $arrows: any = null;
  currentSlide: number = 0;
  $currentActiveSlides = [];
  $currentSlide: any;
  numberOfSlides: number;
  sliderContainerDimension = {
    height: 200,
    width: 200
  };
  isReiniting = false;
  SLIDER_LENGTH = 999; // the default length of the slider depending on it's orientation [HORIZONTAL | VERTICAL]
  sliderDimension = {
    width: "100%",
    length: this.SLIDER_LENGTH
  };
  slideWidth = 0;
  orientations = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
  };
  options: any;
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
    onInitilizeEventHandler: Object
  };
  dragStartPos: number | null = null;
  sliderOffset: number = 0;
  dragOffsetFromTouchPoint: number = 0;
  isDragging = {
    left: false,
    right: false,
    top: false,
    bottom: false
  };
  sliderScrollTrail: SliderScrollTrails[] = [];
  currentActiveSlides: number[] = [];
  SCROLL_RIGHT = "right";
  SCROLL_LEFT = "left";
  timerId: number;
  events: Events = {
    swipe: null,
    preSwipe: null,
    postSwipe: null,
    initialize: null
  };
  osliderId = 0;

  constructor(selector: any, options: {}) {
    let o = this;
    o.osliderId = osliderId + 1;
    osliderId = this.osliderId;
    o.selector = selector;
    o.$selector = $(selector);
    o.options = $.extend({}, o.defaultOptions, options);

    if (o.options.scrollSlides > o.options.visibleSlides) {
      throw new Error("Constraint scrollSlides <= visibleSlides not upheld");
    }
    o.events = {
      swipe: eventData => JQuery.Event("oslider.swipe", { oslider: eventData }),
      preSwipe: eventData =>
        JQuery.Event("oslider.preswipe", { oslider: eventData }),
      postSwipe: eventData =>
        JQuery.Event("oslider.postSwipe", { oslider: eventData }),
      initialize: eventData =>
        JQuery.Event("oslider.initialize", { oslider: eventData })
    };
    o.bootstrap();
    return o;
  }

  getId(): number {
    return this.osliderId;
  }

  addSlides(els: Array<string>, index: number, before: boolean = false) {
    let o = this;
    o.addSlide(els, index, before);
  }

  addSlide(el: string | Array<string>, index: number, before: boolean = false) {
    let o = this,
      $els,
      $targetEl;

    if (typeof el === "string") {
      $els = [$(el)];
    } else if (Array.isArray(el)) {
      $els = el.map(e => $(e));
    }

    if (index === undefined) {
      index = o.$slides.length - 1;
    }
    $targetEl = $(o.$slides.get(index));

    if ($targetEl === undefined) {
      throw new Error("Index out of bound");
    }

    if (index < o.currentSlide && before) {
      // new slides addition invalidates our currentSlide index
      this.currentSlide = index + $els.length;
    }

    if (before) {
      $targetEl.before($els);
    } else {
      $targetEl.after($els);
    }
    o.tearDownListeners();
    o.reboot();
  }

  removeSlides(indices: Array<number>) {
    let o = this;
    for (let index of indices) {
      o.removeSlide(index);
    }
  }

  removeSlide(index: number) {
    let o = this,
      $targetEl;

    if (index === undefined) {
      console.warn("[WARNING]: No slide index provided. No slide was removed");
      return;
    }
    $targetEl = $(o.$slides.get(index));
    if ($targetEl.length == 0) {
      console.error(
        `[ERROR]: Index ${index} is out of bounds of slides list(${
          o.numberOfSlides
        }`
      );
      return;
    }
    $targetEl.remove();
    if (index < o.currentSlide) {
      o.currentSlide = o.currentSlide - 1;
    }
    o.tearDownListeners();
    o.reboot();
  }

  autoPlay() {
    let o = this,
      autoPlayFn;
    autoPlayFn = () => {
      if (o.currentSlide <= o.numberOfSlides) {
        o.scrollRight();
        o.updateDotNav(o.SCROLL_RIGHT);
      }
    };
    o.timerId = setInterval(autoPlayFn.bind(o), o.options.autoplaySpeed);
  }

  restartAutoPlay() {
    clearInterval(this.timerId);
    this.autoPlay();
  }

  getVisibleSlides() {
    return this.$currentActiveSlides;
  }

  getVisibleSlidesIndex(): Array<number> {
    return this.currentActiveSlides;
  }

  getTrailDirection() {
    let len = this.sliderScrollTrail.length,
      matches = {
        right: 0,
        left: 0,
        top: 0,
        bottom: 0
      };

    for (let trailDirection of this.sliderScrollTrail) {
      if (trailDirection == SliderScrollTrails.Left) {
        matches.left += 1;
      } else if (trailDirection == SliderScrollTrails.Right) {
        matches.right += 1;
      } else if (trailDirection == SliderScrollTrails.Top) {
        matches.top += 1;
      } else if (trailDirection == SliderScrollTrails.Bottom) {
        matches.bottom += 1;
      }
    }

    if (this.options.orientation == Orientations.HORIZONTAL) {
      return matches.right > matches.left
        ? SliderScrollTrails.Right
        : SliderScrollTrails.Left;
    } else if (this.options.orientation == Orientations.VERTICAL) {
      return matches.top > matches.left
        ? SliderScrollTrails.Top
        : SliderScrollTrails.Bottom;
    }
  }

  /**
   * [getScrollOffsetFor description]
   * @param {[type]}    direction=this.SCROLL_RIGHT [description]
   * @param {number = null}        slideIndex [description]
   */
  getScrollOffsetFor(direction, slideIndex: number = null) {
    let o = this,
      offset;

    // if (slideIndex !== null) {
    // 	if (direction == o.SCROLL_LEFT) {
    // 		if (slideIndex < o.currentSlide && slideIndex >= 0) {
    // 			o.currentSlide = slideIndex + 1; // we have to increate it by, making it seems like the current slide is a slide ahead of the need slide index
    // 		}
    // 	} else if (direction == o.SCROLL_RIGHT) {
    // 		if (slideIndex > o.currentSlide && slideIndex <= o.numberOfSlides) {
    // 			o.currentSlide = slideIndex - 1;
    // 		}
    // 	}
    // }
    // console.log('hey', slideIndex);
    if (slideIndex !== null) {
      o.currentSlide = 0;
    } else {
      slideIndex = 1;
    }

    if (direction == o.SCROLL_RIGHT) {
      if (o.options.orientation == this.orientations.HORIZONTAL) {
        if (o.options.visibleSlides == 1) {
          // Disregard o.options.scrollSlides
          offset =
            -1 *
            ((o.currentSlide + slideIndex) * o.sliderContainerDimension.width);
        } else {
          offset =
            -1 *
            ((o.currentSlide + slideIndex) *
              o.options.scrollSlides *
              o.slideWidth);
        }
      } else if (o.options.orientation == this.orientations.VERTICAL) {
        if (o.options.visibleSlides == 1) {
          // Disregard o.options.scrollSlides
          offset =
            -1 *
            ((o.currentSlide + slideIndex) * o.sliderContainerDimension.height);
        } else {
          offset =
            -1 *
            ((o.currentSlide + slideIndex) *
              o.options.scrollSlides *
              o.slideWidth);
        }
      }
      return offset;
    } else if (direction == o.SCROLL_LEFT) {
      if (o.options.orientation == this.orientations.HORIZONTAL) {
        if (o.options.visibleSlides == 1) {
          // Disregard scrollSlides
          offset =
            -1 *
            ((o.currentSlide - slideIndex) * o.sliderContainerDimension.width);
        } else {
          offset =
            -1 *
            ((o.currentSlide - slideIndex) *
              o.options.scrollSlides *
              o.slideWidth);
        }
      } else if (o.options.orientation == this.orientations.VERTICAL) {
        if (o.options.visibleSlides == 1) {
          // Disregard scrollSlides
          offset =
            -1 *
            ((o.currentSlide - slideIndex) * o.sliderContainerDimension.height);
        } else {
          offset =
            -1 *
            ((o.currentSlide - slideIndex) *
              o.options.scrollSlides *
              o.slideWidth);
        }
      }
      return offset;
    }
  }

  scrollLeft(scrollPixels?: number, rescroll: boolean = false) {
    let o = this,
      offset;
    o.$selector.trigger(
      o.events.preSwipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: o.SCROLL_LEFT,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );

    if (o.currentSlide == 0) return;

    if (scrollPixels !== undefined) {
      if (rescroll == false) {
        scrollPixels = o.sliderOffset + scrollPixels;
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
    } else {
      // let scrollOffset = o.getScrollOffsetFor(o.SCROLL_LEFT);
      o.performCompleteScroll(o.SCROLL_LEFT);
      o.$selector.trigger(
        o.events.swipe({
          currentSlideEls: o.$currentActiveSlides,
          currentSlideIndex: o.currentSlide,
          swipeDirection: o.SCROLL_LEFT,
          sliderId: o.getId(),
          sliderInstance: o
        })
      );

      o.$selector.trigger(
        o.events.postSwipe({
          currentSlideEls: o.$currentActiveSlides,
          currentSlideIndex: o.currentSlide,
          swipeDirection: o.SCROLL_LEFT,
          sliderId: o.getId(),
          sliderInstance: o
        })
      );
    }
  }

  scrollRight(scrollPixels?: number, rescroll: boolean = false) {
    let o = this,
      offset;

    o.$selector.trigger(
      o.events.preSwipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: o.SCROLL_LEFT,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );

    if (
      o.currentSlide ==
      Math.ceil(o.numberOfSlides / o.options.scrollSlides) - 1
    ) {
      if (o.options.infinite) {
        // We've gotten to the last slide, time to start from the very first again.
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
    } else {
      o.performCompleteScroll(o.SCROLL_RIGHT);
      o.$selector.trigger(
        o.events.swipe({
          currentSlideEls: o.$currentActiveSlides,
          currentSlideIndex: o.currentSlide,
          swipeDirection: o.SCROLL_RIGHT,
          sliderId: o.getId(),
          sliderInstance: o
        })
      );

      o.$selector.trigger(
        o.events.postSwipe({
          currentSlideEls: o.$currentActiveSlides,
          currentSlideIndex: o.currentSlide,
          swipeDirection: o.SCROLL_RIGHT,
          sliderId: o.getId(),
          sliderInstance: o
        })
      );
    }
  }

  performCompleteScroll(
    scrollDirection = this.SCROLL_RIGHT,
    slideIndex?: number
  ) {
    let o = this,
      scrollOffset,
      hasSlideIndex = false;

    if (slideIndex !== undefined) {
      hasSlideIndex = true;
      scrollOffset = o.getScrollOffsetFor(scrollDirection, slideIndex);
    } else {
      scrollOffset = o.getScrollOffsetFor(scrollDirection);
    }

    if (o.options.orientation == this.orientations.HORIZONTAL) {
      o.$slider.css({
        left: scrollOffset
      });
      o.sliderOffset = scrollOffset;
    } else if (o.options.orientation == this.orientations.VERTICAL) {
      o.$slider.css({
        top: scrollOffset
      });
      o.sliderOffset = scrollOffset;
    }

    if (hasSlideIndex) {
      o.currentSlide = slideIndex;
    } else if (scrollDirection == o.SCROLL_RIGHT) {
      o.currentSlide = o.currentSlide + 1;
    } else if (scrollDirection == o.SCROLL_LEFT) {
      o.currentSlide = o.currentSlide - 1;
    }
    o.updateCurrentActiveSlides();
    o.updateDotNav();

    o.$selector.trigger(
      o.events.swipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: scrollDirection,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );

    o.$selector.trigger(
      o.events.postSwipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: scrollDirection,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );
  }

  scrollLeftTo(slideIndex: number = 0) {
    let o = this,
      offset;

    o.performCompleteScroll(o.SCROLL_LEFT, slideIndex);
    o.$selector.trigger(
      o.events.swipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: o.SCROLL_LEFT,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );

    o.$selector.trigger(
      o.events.postSwipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: o.SCROLL_LEFT,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );
  }

  scrollRightTo(slideIndex: number = 0) {
    let o = this,
      offset;

    o.performCompleteScroll(o.SCROLL_RIGHT, slideIndex);
    o.$selector.trigger(
      o.events.swipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: o.SCROLL_RIGHT,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );

    o.$selector.trigger(
      o.events.postSwipe({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: o.SCROLL_RIGHT,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );
  }

  scrollTo(slideIndex: number = 0) {
    this.scrollRightTo(slideIndex);
  }

  setupListeners() {
    let o = this;

    o.$selector.on("oslider.swipe", event =>
      o.options.onSwipeEventHandler.call(o, event)
    );
    o.$selector.on("oslider.preswipe", event =>
      o.options.onPreswipeEventHandler.call(o, event)
    );
    o.$selector.on("oslider.postswipe", event =>
      o.options.onPostswipeEventHandler.call(o, event)
    );
    o.$selector.on("oslider.initialize", event =>
      o.options.onInitilizeEventHandler.call(o, event)
    );

    if (o.options.dotNav) {
      o.$dotNavWrapper.children().on("click", function() {
        let $dot = $(this),
          index = $dot.data("index");

        if (index == o.currentSlide) {
          return;
        }
        if (index < o.currentSlide) {
          o.currentSlide = index + 1;
          o.scrollLeft();
          o.updateDotNav(o.SCROLL_LEFT);
        } else if (index > o.currentSlide) {
          o.currentSlide = index - 1;
          o.scrollRight();
          o.updateDotNav(o.SCROLL_RIGHT);
        }
        if (o.options.autoplay) {
          o.restartAutoPlay();
        }
      });
    }

    if (o.options.showNav) {
      o.$arrows.on("click", function(event) {
        event.preventDefault();
        o.handleSlide($(this));
        if (o.options.autoplay) {
          o.restartAutoPlay();
        }
      });
    }

    o.$selector.find(".oslider").on("dragstart touchstart", dragStart);
    o.$selector.find(".oslider").on("dragend touchend", dragEnd);
    o.$selector.find(".oslider").on("drag touchmove", drag);

    function dragStart(event) {
      o.sliderScrollTrail = [];
      let ghostImg = document.querySelector(".oslider__ghostImg");
      event.originalEvent.dataTransfer.setDragImage(ghostImg, 0, 0);

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
        if (o.isDragging.left == true) {
          // a mouse swipe to the left
          if (o.dragOffsetFromTouchPoint > 0) {
            if (o.dragOffsetFromTouchPoint > o.slideWidth / 4) {
              o.scrollRight();
              o.updateCurrentActiveSlides();
              o.updateDotNav(o.SCROLL_LEFT);
            } else {
              o.scrollRight(o.sliderOffset, true);
              o.updateCurrentActiveSlides();
              o.updateDotNav(o.SCROLL_LEFT);
            }
          }
        } else if (o.isDragging.right == true) {
          // a mouse swipe to the right
          if (o.dragOffsetFromTouchPoint > 0) {
            if (o.dragOffsetFromTouchPoint > o.slideWidth / 4) {
              o.scrollLeft();
              o.updateCurrentActiveSlides();
              o.updateDotNav(o.SCROLL_RIGHT);
            } else {
              o.scrollLeft(o.sliderOffset, true);
              o.updateCurrentActiveSlides();
              o.updateDotNav(o.SCROLL_RIGHT);
            }
          }
        }
        o.isDragging.left = o.isDragging.right = false;
      } else if (o.options.orientation == o.orientations.VERTICAL) {
        if (o.isDragging.top == true) {
          // a mouse swipe to the top
          if (o.dragOffsetFromTouchPoint > 0) {
            if (o.dragOffsetFromTouchPoint > o.slideWidth / 4) {
              o.scrollRight();
              o.updateCurrentActiveSlides();
              o.updateDotNav(o.SCROLL_LEFT);
            } else {
              o.scrollRight(o.sliderOffset, true);
              o.updateCurrentActiveSlides();
              o.updateDotNav(o.SCROLL_LEFT);
            }
          }
        } else if (o.isDragging.bottom == true) {
          // a mouse swipe to the bottom
          if (o.dragOffsetFromTouchPoint > 0) {
            if (o.dragOffsetFromTouchPoint > o.slideWidth / 4) {
              o.scrollLeft();
              o.updateCurrentActiveSlides();
              o.updateDotNav(o.SCROLL_RIGHT);
            } else {
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
      let offset;
      if (o.options.orientation == o.orientations.HORIZONTAL) {
        if (event.offsetX > 0 && event.offsetX < o.dragStartPos) {
          // a left swipe/mouse scroll equiavlent to a left nav click
          offset = Math.abs(o.dragStartPos) - Math.abs(event.offsetX);
          o.dragOffsetFromTouchPoint = offset;
          o.isDragging.left =
            o.getTrailDirection() == SliderScrollTrails.Left ? true : false;
          o.isDragging.right =
            o.getTrailDirection() == SliderScrollTrails.Right ? true : false;
          o.scrollRight(offset);
          o.sliderScrollTrail.push(SliderScrollTrails.Left);
        } else if (event.offsetX > o.dragStartPos) {
          // a right swipe/mouse scroll equiavlent to a right nav click
          o.isDragging.left =
            o.getTrailDirection() == SliderScrollTrails.Left ? true : false;
          o.isDragging.right =
            o.getTrailDirection() == SliderScrollTrails.Right ? true : false;
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
          o.isDragging.top =
            o.getTrailDirection() == SliderScrollTrails.Top ? true : false;
          o.isDragging.bottom =
            o.getTrailDirection() == SliderScrollTrails.Bottom ? true : false;
          o.scrollRight(offset);
          o.sliderScrollTrail.push(SliderScrollTrails.Top);
        } else if (event.offsetY > o.dragStartPos) {
          // a bottom swipe/mouse scroll equiavlent to a bottom nav click
          o.isDragging.top =
            o.getTrailDirection() == SliderScrollTrails.Top ? true : false;
          o.isDragging.bottom =
            o.getTrailDirection() == SliderScrollTrails.Bottom ? true : false;
          offset = Math.abs(event.offsetY) - Math.abs(o.dragStartPos);
          if (offset > 0) {
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
    if (
      $arrow.hasClass("oslider__arrow--left") ||
      $arrow.hasClass("oslider__arrow--top")
    ) {
      o.scrollLeft();
    }
    if (
      $arrow.hasClass("oslider__arrow--right") ||
      $arrow.hasClass("oslider__arrow--bottom")
    ) {
      o.scrollRight();
    }
  }

  reboot() {
    let o = this;
    o.isReiniting = true;
    o.bootstrap();
  }

  tearDownListeners() {
    let o = this;
    o.$selector.off(
      "oslider.swipe oslider.preswipe oslider.postswipe oslider.initialize"
    );
    if (o.options.dotNav) {
      o.$dotNavWrapper.children().off("click");
    }
    o.$arrows.off("click");
    o.$selector.find(".oslider").off("dragstart touchstart");
    o.$selector.find(".oslider").off("dragend touchend");
    o.$selector.find(".oslider").off("drag touchmove");
  }

  bootstrap() {
    let o = this,
      height,
      width;

    o.prepareSlider();
    o.setupNavigations();
    o.setupDotNavigation();
    if (o.options.orientation == o.orientations.HORIZONTAL) {
      o.$slider
        .addClass("oslider--horizontal")
        .width(o.sliderDimension.length)
        .height(o.sliderDimension.width);
      if (o.options.visibleSlides == 1) {
        width = o.$selector.width();
      } else {
        width = o.sliderContainerDimension.width / o.options.visibleSlides;
      }
      o.slideWidth = width;
      o.$slides.each(function() {
        let $slide = $(this);
        if ($slide.is("img")) {
          $slide.attr("width", width);
          $slide.attr("height", o.$selector.height());
        } else {
          $slide.outerWidth(width); // outerWidth covers the slide's content, padding, and margin.
        }
      });
    } else if (o.options.orientation == o.orientations.VERTICAL) {
      o.$slider.addClass("oslider--vertical");
      o.$slider.height(o.sliderDimension.length).width(o.sliderDimension.width);
      if (o.options.visibleSlides == 1) {
        height = o.$selector.height();
      } else {
        height = o.sliderContainerDimension.height / o.options.visibleSlides;
      }
      o.slideWidth = height;
      o.$slides.each(function() {
        let $slide = $(this);
        if ($slide.is("img")) {
          $slide.attr("height", height);
          $slide.attr("width", o.$selector.width());
        } else {
          $slide.outerHeight(height); // outerHeight covers the slide's content, padding, and margin.
        }
      });
    }
    o.updateCurrentActiveSlides();
    o.updateDotNav();
    if (o.options.autoplay) {
      o.autoPlay();
    }
    // if (!o.isReiniting) {
    o.setupListeners();
    o.$selector.trigger(
      o.events.initialize({
        currentSlideEls: o.$currentActiveSlides,
        currentSlideIndex: o.currentSlide,
        swipeDirection: o.SCROLL_LEFT,
        sliderId: o.getId(),
        sliderInstance: o
      })
    );
    // }
  }

  prepareSlider() {
    let o = this,
      ghostImg;

    o.prepareSlides();
    o.numberOfSlides = o.$selector.find(".oslider__slide").length;
    o.$slider = o.$selector.find(".oslider");
    o.$slides = o.$selector.find(".oslider").children();
    o.sliderContainerDimension.width = o.$selector.width();
    o.sliderContainerDimension.height = o.$selector.height();
    ghostImg = $(
      '<img src="" class="oslider__ghostImg" style="width: 0.1px; height: 0.1px;">'
    );
    o.$selector.append(ghostImg);
  }

  prepareSlides() {
    let o = this,
      $oslider,
      $osliderInnerContainer;

    if (o.$slider == null) {
      $oslider = $('<div class="oslider" draggable="true">');
      o.$selector.addClass("oslider-container").data("oslider-id", o.osliderId);
      $oslider.append(o.$selector.children().addClass("oslider__slide"));
      $osliderInnerContainer = $('<div class="oslider-container__inner">');
      $osliderInnerContainer.append($oslider);
      o.$selector.append($osliderInnerContainer);
      o.$selector = $(document).find(o.selector);
    } else {
      o.$slides = o.$selector
        .find(".oslider")
        .children()
        .addClass("oslider__slide");
    }
  }

  setupNavigations() {
    let o = this,
      $sliderArrowsMarkup,
      offset;

    if (o.isReiniting) return;
    if (o.options.orientation == o.orientations.HORIZONTAL) {
      $sliderArrowsMarkup = `
			<div class="oslider__arrow oslider__arrow--left"><i class="fa fa-arrow-left"></i></div>
			<div class="oslider__arrow oslider__arrow--right"><i class="fa fa-arrow-right"></i></div>
			`;
      o.$selector.append($sliderArrowsMarkup);
      offset =
        o.$selector.height() / 2 - o.$selector.find(".oslider__arrow").height();
      o.$selector.find(".oslider__arrow--left").css({ top: offset });
      o.$selector.find(".oslider__arrow--right").css({ top: offset });
    } else if (o.options.orientation == o.orientations.VERTICAL) {
      $sliderArrowsMarkup = `
			<div class="oslider__arrow oslider__arrow--top"><i class="fa fa-arrow-up"></i></div>
			<div class="oslider__arrow oslider__arrow--bottom"><i class="fa fa-arrow-down"></i></div>
			`;
      o.$selector.append($sliderArrowsMarkup);
      offset =
        o.$selector.width() / 2 - o.$selector.find(".oslider__arrow").width();
      o.$selector.find(".oslider__arrow--bottom ").css({ left: offset });
      o.$selector.find(".oslider__arrow--top").css({ left: offset });
    }
    if (o.options.showNav) {
      o.$selector.find(".oslider__arrow").addClass("oslider__arrow--show");
    }
    o.$arrows = o.$selector.find(".oslider__arrow");
  }

  setupDotNavigation() {
    let o = this,
      $dotNavWrapper,
      dotNavItemsHtml,
      $dotNavItems;

    if (o.options.dotNav) {
      if (o.options.scrollSlides > 1) {
        length = Math.ceil(o.numberOfSlides / o.options.scrollSlides);
      } else {
        length = o.numberOfSlides;
      }
      dotNavItemsHtml = ` `;
      for (let i = 0; i < length; i++) {
        dotNavItemsHtml += `<span class="oslider__dotNav__item" data-index=${i}></span>`;
      }
      $dotNavItems = $(dotNavItemsHtml);
      if (!o.isReiniting) {
        $dotNavWrapper = $(`<div class="oslider__dotNav"></div>`);
        $dotNavWrapper.append($dotNavItems);
        o.$selector.append($dotNavWrapper);
      } else {
        o.$dotNavWrapper.children().remove();
        o.$dotNavWrapper.append($dotNavItems);
      }
      o.$dotNavWrapper = o.$selector.find(".oslider__dotNav");
      if (o.options.orientation == o.orientations.HORIZONTAL) {
        o.$dotNavWrapper.addClass("oslider__dotNav--horizontal");
      } else if (o.options.orientation == o.orientations.VERTICAL) {
        o.$dotNavWrapper.addClass("oslider__dotNav--vertical");
      }
    }
  }

  updateDotNav(slideDirection?: any) {
    let o = this;

    if (!o.options.dotNav) return;

    let activeDotNavIndices = [],
      i;
    for (
      i = o.currentSlide;
      i < o.currentSlide + o.options.visibleSlides;
      i++
    ) {
      activeDotNavIndices.push(i);
    }

    o.$dotNavWrapper.children().each(function() {
      let $dot = $(this),
        index = $dot.data("index");
      if (activeDotNavIndices.indexOf(index) !== -1) {
        $dot.addClass("oslider__dotNav__item--active");
      } else {
        $dot.removeClass("oslider__dotNav__item--active");
      }
    });
  }

  updateCurrentActiveSlides() {
    let o = this;
    o.currentActiveSlides = [];
    o.$currentActiveSlides = [];

    let i = o.currentSlide;
    for (i; i < o.currentSlide + o.options.visibleSlides; i++) {
      o.currentActiveSlides.push(i);
    }
    o.$slides.each(function(index) {
      let $slide = $(this);
      if (o.currentActiveSlides.indexOf(index) !== -1) {
        o.$currentActiveSlides.push($slide);
        $slide.addClass("oslider__slide--active");
      } else {
        $slide.removeClass("oslider__slide--active");
      }
    });
  }
}

interface JQuery {
  oslider(options?: any): JQuery;
}

jQuery.fn.extend({
  oslider: function(options: any) {
    this.each(function() {
      return new Oslider(this, options);
    });
  }
});
