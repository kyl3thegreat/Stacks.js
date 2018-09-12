/*
* stacks.js 1.0.0
* 
* Universal Module Definition (UMD) with Constructor Boilerplate
* @license MIT licensed
* 
* Copyright (C) 2018 kyleshrote.com - A project by Kyle Shrote
*/
(function(root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.stacks = factory(root);
	}
 })(typeof global !== 'undefined' ? global : this.window || this.global, function (root){
 
	'use strict';
 
	//
	// Variables
	//
	var container = document.getElementById('stacks');
	var lastScrollDestiny;
	var lastAnimation = 0;
	var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.msMaxTouchPoints));
	var touchStartY = 0;
	var touchStartX = 0;
	var touchEndY = 0;
	var touchEndX = 0;
	var scrollings = [];
	var scrollDelay = 600;
	
	var stacks = {};
	var settings;
	var defaults = {
		direction: 'vertical',
		scrollingSpeed: 700,
		easing: 'easeInQuart',
		css3: true,
		touchSensitivity: 5,
		normalScrollElements: null,
		normalScrollElementsTouchThreshold: 5,
		keyboardScrolling: true,
		sectionSelector: '.section',

		// events
		afterLoad: null,
		onLeave: null,
		afterRender: null
	}
 

	/*!
	 * Merge two or more objects together.
	 * @param   {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
	 * @param   {Object}   objects  The objects to merge together
	 * @returns {Object}            Merged values of defaults and options
	 */
	var extend = function () {
 
		// Variables
		var extended = {};
		var deep = false;
		var i = 0;
 
		// Check if a deep merge
		if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
			deep = arguments[0];
			i++;
		}
 
		// Merge the object into the extended object
		var merge = function (obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					// If property is an object, merge properties
					if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
						extended[prop] = extend(extended[prop], obj[prop]);
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};
 
		// Loop through each object and conduct a merge
		for (; i < arguments.length; i++) {
			var obj = arguments[i];
			merge(obj);
		}
 
		return extended;
 
	};


	//
	// Public Methods
	//
	/**
	 * Defines the scrolling speed
	*/
	stacks.setScrollingSpeed = function(value){
		options.scrollingSpeed = value;
	}
	/**
	 * Adds or removes the possibility of scrolling through sections by using the mouse wheel or the trackpad 
	*/
	stacks.setMouseWheelScrolling = function(value){
		if(value){
			addMouseWheelHandler();
		} else {
			removeMouseWheelHandler();
		}
	}
	/**
	 * Adds or removes the possibility of scrolling through sections by using the mouse wheel/trackpad or touch gestures
	*/
	stacks.setAllowScrolling = function(value){		
		if(value){
			stacks.setMouseWheelScrolling(true)
			addTouchHandler();
		} else {
			stacks.setMouseWheelScrolling(false);
			removeTouchHandler();
		}
	}
	/**
	 * Adds or removes the possibility of scrolling through sections by using the keyboard arrow keys
	*/
	stacks.setKeyboardScrolling = function(value){
		options.keyboardScrolling = value;
	}
	/**
	 * Moves section Up
	*/
	stacks.moveSectionUp = function(){
		var prev = document.querySelector('.stacks-section.active').previousElementSibling;
		if(prev === null){
			return;
		} else {
			scrollPage(prev)
		}
	}
	/**
	* Moves section Down
	*/
	stacks.moveSectionDown = function(){
		var next = document.querySelector('.stacks-section.active').nextElementSibling;
		if(next === null){
			return
		} else {
			scrollPage(next);
		}
	}

	/**
	* Moves the site to the given index
	*/
	stacks.moveTo = function(section){
		
	}

	
	// adding internal class names to avoid problemswith common ones
	document.querySelectorAll(defaults.sectionSelector).forEach(function(elm){
		elm.classList.add('stacks-section');
	})

	container.style.overflow = 'hidden';
	container.style.msTouchAction = 'none';
	container.style.touchAction = 'none';

	stacks.setAllowScrolling(true);

	var zIndex = document.querySelectorAll('.stacks-section').length;

	document.querySelectorAll('.stacks-section').forEach(function(item, i) {

		// add data attr [i] to each
		item.setAttribute('data-index', i);

		// add z-index css prop [i] to each
		item.style.zIndex = zIndex;

		// if no active section is defined, the 1st one will be the default
		if(!i && document.querySelectorAll('.stacks-section.active').length === 0){
			item.classList.add('active')
		}

		// if verticalCentered == true && hasClass 'stacks-scrollable' !== true
		// if(options.verticalCentered && !item.classList.contains('stacks-scrollable')){
		// 	addTableClass(item)
		// }
		zIndex = zIndex - 1;
	})

	/**
	 * Sliding with arrow keys
	 */
	document.addEventListener('keydown', (event) => {
		if(settings.keyboardScrolling && !isMoving()){
			switch(event.key){
				// up
				case "ArrowUp":
					stacks.moveSectionUp();
					break;
				// down
				case "ArrowDown":
					stacks.moveSectionDown();
					break;
				default:
					return; // exit listener for all other keys

			}
		}
		
	})

	//
	// Private Methods
	//

	/**
	 * Scrolls the page to the given destination
	 */
	function scrollPage(destination, animated){
		var v = {
			destination: destination,
			animated: animated,
			activeSection: document.querySelector('.stacks-section.active'),
			sectionIndex: parseInt(destination.dataset.index),
			toMove: destination,
			yMovement: getYmovement(destination),
			leavingSection: parseInt(destination.dataset.index) + 1
		}

		// quiting when activeSection is the target element
		if(v.activeSection === destination){
			return;
		}

		if(typeof v.animated === 'undefined'){
			v.animated = true;
		}

		v.destination.classList.add('active');
		v.activeSection.classList.remove('active');
		v.sectionsToMove = getSectionsToMove(v);

		// scrolling down(moving sections up making them disappear)
		if(v.yMovement === 'down'){
			v.translate3d = getTranslate3d();
			v.scrolling = '-100%';
			v.animateSection = v.activeSection;
		}

		// scrolling up (moving section down the viewport)
		else {
			v.translate3d = 'translate3d(0px, 0px, 0px)';
			v.scrolling = '0';
			v.animateSection = destination;
		}

		performMovement(v);

		var timeNow = new Date().getTime();
		lastAnimation = timeNow;
	
	}

	/**
	 * Returns `up` or `down` depending on the scrolling movement to reach its destination
	 * from the current section
	 */
	function getYmovement(destiny){
		var fromIndex = parseInt(document.querySelector('.stacks-section.active').dataset.index);
		var toIndex = parseInt(destiny.dataset.index);

		
		
		if(fromIndex > toIndex){
			return 'up';
		}
		return 'down';
	}

	/**
	 * Determines if the transitions betwwen sections still taking place
	 * The variable `scrollDelay` adds a save zone for devices such as apple laptops and apple magic mouses
	 */
	function isMoving(){
		var timeNow = new Date().getTime();
		// Cancel scroll if currently animating or within quiet period
		if(timeNow - lastAnimation < scrollDelay + settings.scrollingSpeed) {
			return true;
		}
		return false
	}

	/**
	 * Detecting mousewheel scrolling
	 */
	var prevTime = new Date().getTime();

	function MouseWheelHandler(e){
		var curTime = new Date().getTime();

		// cross browser wheel delta
		e = e || root.event;
		var value = e.wheelDelta || -e.deltaY || -e.detail;
		var delta = Math.max(-1, Math.min(1, value));

		var horizontalDetection = typeof e.wheelDeltaX !== 'undefined' || typeof e.deltaX !== 'undefined';
		var isScrollingVertically = (Math.abs(e.wheelDeltaX) < Math.abs(e.wheelDelta)) || (Math.abs(e.deltaX) < Math.abs(e.deltaY) || !horizontalDetection);

		// Limiting the array to 150 
		if(scrollings.length > 149){
			scrollings.shift();
		}

		// keeping record of the previous scrollings
		scrollings.push(Math.abs(value));

		// time difference between the last scroll and the current one
		var timeDiff = curTime-prevTime;
		prevTime = curTime;

		// havent they scrolled in a while?
		// (enough to be consider a different scrolling action to scroll another section)
		if(timeDiff > 200){
			// emptying the array, we dont care about old scrollings for our averages
			scrollings = [];
		}

		if(!isMoving()){
			var activeSection = document.querySelector('.stacks-section.active');
			var scrollable = isScrollable(activeSection);
			var averageEnd = getAverage(scrollings, 10);
			var averageMiddle = getAverage(scrollings, 70);
			var isAccelerating = averageEnd >= averageMiddle;

			if(isAccelerating && isScrollingVertically){
				// scrolling down?
				if(delta < 0){
					scrolling('down', scrollable);
				} else if(delta > 0){
					// scrolling up?
					scrolling('up', scrollable);
				}
			}
			return false
		}
	}

	/**
	 * Gets the average of the last `number` elements of the given array
	 */
	function getAverage(elements, number){
		var sum = 0;

		// taking `nuber` elements from the end to make the average, if there are not enough, 1
		var lastElements = elements.slice(Math.max(elements.length - number, 1));

		for(var i = 0; i < lastElements.length; i++){
			sum = sum + lastElements[i];
		}
		return Math.ceil(sum/number);

	}

	/**
	 * Determines the way of scrolling up or down:
	 * by `automatically` scrolling a section or by using the default and normal scrolling
	 */
	function scrolling(type, scrollable){
		var check;
		var scrollSection;

		if(type == 'down'){
			check = 'bottom';
			scrollSection = stacks.moveSectionDown
		} else {
			check = 'top';
			scrollSection = stacks.moveSectionUp
		}

		if(scrollable.length > 0){
			// is the scrollbar at the start/end of the scroll?
			if(isScrolled(check, scrollable)){
				scrollSection();
			} else {
				return true;
			}
		} else {
			// moved up/down
			scrollSection();
		}

	}

	/**
	 * NEED TO SWAP JQUERY METHODS FOR VANILLA JS
	 * Return a boolean depending on whether the scrollable element is at the end or at the start of the scrolling, depending on the given type
	 */
	function isScrolled(type, scrollable){
		if(type === 'top'){
			return !scrollable.scrollTop();
		} else if(type === 'bottom'){
			return scrollable.scrollTop() + 1 + scrollable.innerHeight() >= scrollable[0].scrollHeight;
		}
	}

	/**
	 * Determines whether the active section or slide is scrollable through and scrolling bar
	 */
	function isScrollable(activeSection){
		var scrollable = activeSection;
		
		if(scrollable.classList.contains("stacks-scrollable")){
			return activeSection;
		} else {
			return activeSection;
		}
	}


	/**
	 * Removes the auto scrolling action fired by the mouse wheel and trackpad
	 * After this function is called, the mousewheel and trackpad movements wont scroll through sections
	 */
	function removeMouseWheelHandler(){
		if(container.addEventListener){
			container.removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Opera
			container.removeEventListener('wheel', MouseWheelHandler, false); // Firefox
		} else {
			container.detachEvent('onmousewheel', MouseWheelHandler); // IE 8/7/6
		}
	}

	/**
	 * Adds the auto scrolling action for the mouse wheel and trackpad. After this function is called the mousewheel and trackpad movements will scroll through sections
	 */
	function addMouseWheelHandler(){
		if(container.addEventListener){
			container.addEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Opera
			container.addEventListener('wheel', MouseWheelHandler, false); // Firefox
		} else {
			container.attachEvent('onmousewheel', MouseWheelHandler); // IE 8/7/6
		}
	}

	/**
	 * Adds the possibility to auto scroll through sections on touch devices
	 */
	function addTouchHandler(){
		if(isTouch){
			// Microsoft pointers
			var MSPointer = getMSPointer();
			// container.removeEventListener('touchstart ' + MSPointer.down, touchStartHandler());
			// container.removeEventListener('touchmove ' + MSPointer.move, touchMoveHandler());
			container.addEventListener('touchstart', touchStartHandler);
			container.addEventListener('touchmove', touchMoveHandler);
		}
	}

	/**
	 * Removes the auto scrolling for touch devices
	 */
	function removeTouchHandler(){
		if(isTouch){
			// Microsoft Pointers
			var MSPointer = getMSPointer();

			container.removeEventListener('touchstart '+ MSPointer.down);
			container.removeEventListener('touchmove '+ MSPointer.move);
		}
	}

	/**
	* Enables verical centering by wrapping the content and the use of table and table-cell
	*/
	function addTableClass(elm){
		elm.classList.add('stacks-table')
	}

	/**
	 * Returns an object with Microsoft pointers
	 */
	function getMSPointer(){
		var pointer;

		// IE >= 11 & rest of browsers
		if(window.PointerEvent){
			pointer = {down: 'pointerdown', move: 'pointermove', up: 'pointerup'}
		} else {
			pointer = {down: 'MSPointerDown', move: 'MSPointerMove', up: 'MSPointerUp'}
		}

		return pointer;
	}

	/**
	 * Gets the pageX and pageY properties depending on the browser
	 */
	function getEventsPage(e){
		var events = new Array();
		events.y = (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY);
		events.x = (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX);
		return events;
	}

	/**
	 * As IE >= fires both touch and mouse events when using a mouse in a touchscreen
	 * this way we make sure that is really a touch event what IE is detecting
	 */
	function isReallyTouch(e){
		// if is not IE || IE is detecting `touch` or `pen`
		return typeof e.pointerType === 'undefined' || e.pointerType != 'mouse';
	}

	/**
	 * Getting the starting positions of the touch event
	 */
	function touchStartHandler(event){
		var e = event
		if(isReallyTouch(e)){
			var touchEvents = getEventsPage(e);
			touchStartY = touchEvents.y;
			touchStartX = touchEvents.x; 
		}
	}

	/**
	 * Detecting touch events
	 */
	function touchMoveHandler(event){
		var e = event;		

		// additional: if one of the normalScrollElements isnt within options.normalScrollElementTouchThreshold hops up the DOM chain
		if(isReallyTouch(e)){
			var activeSection = document.querySelector('.stacks-section.active');
			var scrollable = isScrollable(activeSection);

			if(!isScrollable.length){
				event.preventDefault();
			}

			if(!isMoving()){				
				var touchEvents = getEventsPage(e);
				touchEndY = touchEvents.y;
				touchEndX = touchEvents.x;				

				// X movement bigger than Y movement ?
				if(settings.direction === 'horizontal' && Math.abs(touchStartX - touchEndX) > (Math.abs(touchStartY - touchEndY))){
					// is the movement greater than the minimum resistance to scroll ?
					if(Math.abs(touchStartX > touchEndX)) {
						scrolling('down', scrollable);
					} else if (touchEndX >  touchStartX) {
						scrolling('up', scrollable);
					}
				} else {
					if(Math.abs(touchStartY - touchEndY) > (container.offsetHeight / 100 * settings.touchSensitivity)) {
						if(touchStartY > touchEndY) {
							scrolling('down', scrollable);
						} else if (touchEndY > touchStartY) {
							scrolling('up', scrollable);
						}
					}
				}
			} 
		}

	}

	/**
	 * Performs the movement (by CSS3)
	 */
	function performMovement(v){
		
		if(settings.css3){
			
			transformContainer(v.animateSection, v.translate3d, v.animated);

			v.sectionsToMove.forEach(function(elm){
				transformContainer(elm, v.translate3d, v.animated);
			})

			setTimeout(function(){
				afterSectionLoads(v);
			}, settings.scrollingSpeed);
		} else {
			
			v.scrollOptions = getScrollProp(v.scrolling);
			if(v.animated){
				v.animateSection.animate(
					v.scrollOptions,
					settings.scrollingSpeed, settings.easing, function(){
						readjustSections(v);
						afterSectionLoads(v)
					}
				);
			} else {
				v.animateSection.style.top = v.scrolling;
				setTimeout(function(){
					readjustSections(v);
					afterSectionLoads(v);
				}, 400);
			}
		}
	}

	/**
	 * Adds a css3 transform property to the container class with or without animation depending on the animated param
	 */
	function transformContainer(element, translate3d, animated){
		element.classList.toggle('stacks-easing');	
		element.style.webkitTransform = translate3d
		element.style.mozTransform = translate3d
		element.style.msTransform = translate3d
		element.style.transform = translate3d
	}
 
	/**
	 * Actions to execute after a section is loaded
	 */
	function afterSectionLoads(v){

	}

	/**
	 * Returns an array of the sections that need to be moved
	 */
	function getSectionsToMove(v){
		var sectionToMove = [];

		if(v.yMovement === 'down'){
			document.querySelectorAll('.stacks-section').forEach(function(elm, index){
				if(index < parseInt(v.destination.dataset.index)){
					sectionToMove.push(elm)
				}
			})
		} else {
			document.querySelectorAll('.stacks-section').forEach(function(elm, index){
				if(index > parseInt(v.destination.dataset.index)){
					sectionToMove.push(elm);
				}
			})
		}
		return sectionToMove
	}

	/**
	 * Returns the sections to re-adjust in the background after the section loads
	 */
	function readjustSections(v){
		if(v.yMovement === 'up'){
			v.sectionsToMove.forEach(function(elm){
				elm.style.top = v.scrolling
			})
		}
	}

	/**
	 * Gets the property used to create the scrolling effect when using jquery animations depending on the
	 * plugin direction option
	 */
	function getScrollProp(propertyValue){
		if(settings.direction === 'vertical'){
			return { 'top': propertyValue };
		}
		return { 'left': propertyValue };
	}

	/**
	 * Get's the translate3d property to apply when using css3:true depending on the `direction` option
	 */
	function getTranslate3d(){
		if(settings.direction !== 'vertical'){
			return 'translate3d(-100%, 0px, 0px)';
		}
		return 'translate3d(0px, -100%, 0px)';
	}

	// Utilities
	
  
	/**
	 * Initialize Plugin
	 * @public
	 * @param {Object} options User settings
	*/
	stacks.init = function (options) {
 
		// Merge options into defaults
		settings = extend(defaults, options || {});
 
		// Code goes here...
		
 
	};
 
	//
	// Public API
	//
 
	return stacks;
 
});

