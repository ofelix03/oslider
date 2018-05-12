export declare enum Orientations {
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical",
}
export declare enum DragDirections {
    Left = "left",
    Right = "right",
    Top = "top",
    Bottom = "bottom",
}
export declare enum SliderScrollTrails {
    Left = "left",
    Right = "right",
    Top = "top",
    Bottom = "bottom",
}
export interface DefaultOptions {
    visibleSlides: number;
    scrollSlides: number;
    orientation: Orientations;
    slideSize: null | number;
    scrollPos: number;
    sliderWidth: number;
    sliderHeight: string;
    slideTo: number;
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
export declare class Oslider {
    Events: Events;
    id: number;
    selector: string;
    $selector: any;
    $dotNavWrapper: any;
    $oslider: any;
    $slider: any;
    $slides: any;
    slidesWidths: number[];
    $arrows: any;
    currentSlide: number;
    $currentActiveSlides: any[];
    $currentSlide: any;
    numberOfSlides: number;
    sliderContainerDimension: {
        height: number;
        width: number;
    };
    isReiniting: boolean;
    SLIDER_LENGTH: number;
    sliderDimension: {
        width: string;
        length: number;
    };
    slideWidth: number;
    options: any;
    defaultOptions: any;
    dragStartPos: number | null;
    sliderOffset: number;
    dragOffsetFromTouchPoint: number;
    isDragging: {
        left: boolean;
        right: boolean;
        top: boolean;
        bottom: boolean;
    };
    sliderScrollTrail: SliderScrollTrails[];
    currentActiveSlides: number[];
    SCROLL_RIGHT: string;
    SCROLL_LEFT: string;
    timerId: number;
    events: Events;
    osliderId: number;
    constructor(selector: any, options: {});
    getId(): number;
    addSlides(els: Array<string>, index: number, before?: boolean): void;
    addSlide(el: string | Array<string>, index: number, before?: boolean): void;
    removeSlides(indices: Array<number>): void;
    removeSlide(index: number): void;
    autoPlay(): void;
    restartAutoPlay(): void;
    getVisibleSlides(): any[];
    getVisibleSlidesIndex(): Array<number>;
    getTrailDirection(): SliderScrollTrails;
    /**
     * [getScrollOffsetFor description]
     * @param {[type]}    direction=this.SCROLL_RIGHT [description]
     * @param {number = null}        slideIndex [description]
     */
    getScrollOffsetFor(direction: any, slideIndex?: number): any;
    scrollLeft(scrollPixels?: number, rescroll?: boolean): void;
    scrollRight(scrollPixels?: number, rescroll?: boolean): void;
    performCompleteScroll(scrollDirection?: string, slideIndex?: number): void;
    scrollLeftTo(slideIndex?: number): void;
    scrollRightTo(slideIndex?: number): void;
    scrollTo(slideIndex?: number): void;
    setupListeners(): void;
    handleSlide($arrow?: any): void;
    reboot(): void;
    tearDownListeners(): void;
    applyMarginWidthHeightToSlide($slide: any, orientation: Orientations): any;
    getSlide(index: number): any;
    bootstrap(): void;
    prepareSlider(): void;
    prepareSlides(): void;
    setupNavigations(): void;
    setupDotNavigation(): void;
    updateDotNav(slideDirection?: any): void;
    updateCurrentActiveSlides(): void;
}
export interface JQuery {
    oslider(options?: any): JQuery;
}
