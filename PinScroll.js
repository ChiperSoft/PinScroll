/*********************************************************************************************************
	PinScroll v0.1
	Adds markers to the page scrollbar to indicate the location of key elements on the page.
	Inspired by a simmilar mechanism used on MSNBC.com

	Copyright (c) 2010, Jarvis Badgley - chiper[at]chipersoft[dot]com

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*********************************************************************************************************/

var PinScroll = Class.create({
	initialize: function(pins, opt){
		var self = this; //avoid rebinding anonymous functions
        self.options = {
			pinTrayTag: 'ul',
			pinTrayID: 'Pintray',
			pinTrayPadding: 10,
			pinTrayPaddingTop: undefined,
			pinTrayPaddingBottom: undefined,
			pinTag: 'li',
			
			loadDelay: 1000,
			scrollDuration: 0.5,
			fadeInDuration: 1
       };

		Object.extend(self.options, opt || {});

		Event.observe(window, 'resize', self.update.bind(self));
		
		//create pin tray
		self.pintray = (new Element(this.options.pinTrayTag, {id:self.options.pinTrayID})).hide();

		self.pins = $A();
		
		
		$H(pins).each(function (pin) {
			//iterate over all the pins
			//pin.key contains a selector for the node we want the pin to point at
			//pin.value contains an object indicating what the pin should be made of
			
			var pinTemplate = null;
			if (pin.value) {
				if (pin.value.image) {
					//pin should be made of an image, defined in pin.value.image
					pinTemplate = new Element('img', {src:pin.value.image});
				}
			
				if (pin.value.selector) {
					//pin should be made from a node on the page, defined by a selector.  Grab the first node the selector returns.
					pinTemplate = $$(pin.value.selector).first();
				}
			
				if (pin.value.element) {
					//pin is the element passed in the object
					pinTemplate = $(pin.value.element);
				}
				
				if (pinTemplate) pinTemplate.pinUsed = pinTemplate.pinUsed || 0;
			}
			
			//get all elements on the page that match pin.key and iterate over them
			$$(pin.key).each(function (anchorNode) {
				if (anchorNode.anchorPin) anchorNode.anchorPin.remove();
				if (!pinTemplate) return;
				
				var pinNode = new Element(self.options.pinTag);
					pinNode.pinAnchor = anchorNode;
					
				anchorNode.anchorPin = pinNode;

				//if the pin template has been used, insert the template itself and incriment the used flag.
				//otherwise insert a clone of the template so we don't end up with empty pins
				if (!pinTemplate.pinUsed++) pinNode.insert(pinTemplate.show()); //call show to make sure the element is visible
				else pinNode.insert(pinTemplate.clone(true));

				
				pinNode.observe('click', function (event) {
					//on clicking the pin, scroll to the anchor.  If Scriptaculous is loaded, use Effect.scrollTo
					//otherwise use the document scrollTo

					var margin = parseInt(this.pinAnchor.getStyle("margin-top") || 0);
					if (isNaN(margin)) margin = 0;   // Test for IE

					try {
						Effect.ScrollTo(this.pinAnchor, {duration:self.options.scrollDuration, offset:-margin/2});
					} catch (e) {
						var scrollOffsets = document.viewport.getScrollOffsets(),
							elementOffsets = this.pinAnchor.cumulativeOffset();
							
					  	scrollTo(scrollOffsets.left, elementOffsets[1]-margin/2);
					}
				});
				
				self.pintray.insert(pinNode);
				self.pins.push({anchor:anchorNode, pin:pinNode})
			});
		});
		
		setTimeout(function () {
			if (self.pintray.appear) {
				self.pintray.appear({duration:self.options.fadeInDuration, afterSetup:self.update.bind(self)});
			} else {
				self.pintray.show();
				self.update();
			}
		}, self.options.loadDelay);
		
		document.body.appendChild(this.pintray);
	},
	
	update: function () {
		var viewHeight = document.viewport.getHeight(),
			bodyHeight = Math.max(document.body.getHeight(), viewHeight);
		
		var self = this;
		this.pins.each(function (p) {
			//update pin visibility to match anchor visibility
			p.anchor.visible()&&p.anchor.parentNode?p.pin.show():p.pin.hide();
			
			var elementOffsets = p.anchor.cumulativeOffset(),
				pinHeight = p.pin.getHeight() / 2,
				pinTop = ((elementOffsets[1] / bodyHeight) * viewHeight) - pinHeight;
				
			pinTop = Math.max(
						self.options.pinTrayPaddingTop!=undefined?self.options.pinTrayPaddingTop:self.options.pinTrayPadding, 
						Math.min(
							pinTop,
							viewHeight
							 - pinHeight
							 - (self.options.pinTrayPaddingBottom!=undefined?self.options.pinTrayPaddingBottom:self.options.pinTrayPadding) * 2
						)
					).round();
			
			p.pin.setStyle({top: pinTop+'px' });
		});
	  

	}
});