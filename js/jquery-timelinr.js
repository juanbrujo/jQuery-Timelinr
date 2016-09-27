jQuery.fn.timelinr = function(options){
	// default plugin settings
	settings = jQuery.extend({
		orientation: 							'horizontal',	// value: horizontal | vertical, default to horizontal
		containerDiv: 						'.timeline',	// value: any HTML tag or #id, default to #timeline
		datesDiv: 								'.dates',			// value: any HTML tag or #id, default to #dates
		datesSelectedClass: 			'selected',		// value: any class, default to selected
		datesSpeed: 							'normal',			// value: integer between 100 and 1000 (recommended) or 'slow', 'normal' or 'fast'; default to normal
		issuesDiv: 								'.issues',		// value: any HTML tag or #id, default to #issues
		issuesSelectedClass: 			'selected',		// value: any class, default to selected
		issuesSpeed: 							'fast',				// value: integer between 100 and 1000 (recommended) or 'slow', 'normal' or 'fast'; default to fast
		issuesTransparency: 			0.2,					// value: integer between 0 and 1 (recommended), default to 0.2
		issuesTransparencySpeed: 	500,					// value: integer between 100 and 1000 (recommended), default to 500 (normal)
		prevButton: 							'.prev',			// value: any HTML tag or #id, default to #prev
		nextButton: 							'.next',			// value: any HTML tag or #id, default to #next
		arrowKeys: 								'false',			// value: true | false, default to false
		startAt: 									1,						// value: integer, default to 1 (first)
		autoPlay: 								'false',			// value: true | false, default to false
		autoPlayDirection: 				'forward',		// value: forward | backward, default to forward
		autoPlayPause: 						2000					// value: integer (1000 = 1 seg), default to 2000 (2segs)
	}, options);

	$(function(){
		// Checks if required elements exist on page before initializing timelinr | improvement since 0.9.55
		$(settings.containerDiv).each(function() {

			// setting variables... many of them
			var howManyDates 		= $(this).find(settings.datesDiv+' li').length;
			var howManyIssues 	= $(this).find(settings.issuesDiv+' li').length;
			var currentDate 		= $(this).find(settings.datesDiv).find('a.'+settings.datesSelectedClass);
			var currentIssue 		= $(this).find(settings.issuesDiv).find('li.'+settings.issuesSelectedClass);
			var widthContainer 	= $(this).width();
			var heightContainer = $(this).height();
			var widthIssues 		= $(this).find(settings.issuesDiv).width();
			var heightIssues 		= $(this).find(settings.issuesDiv).height();
			var widthIssue 			= $(this).find(settings.issuesDiv+' li').width();
			var heightIssue 		= $(this).find(settings.issuesDiv+' li').height();
			var widthDates 			= $(this).find(settings.datesDiv).width();
			var heightDates 		= $(this).find(settings.datesDiv).height();
			var widthDate 			= $(this).find(settings.datesDiv+' li').width();
			var heightDate 			= $(this).find(settings.datesDiv+' li').height();

			// set positions!
			if(settings.orientation == 'horizontal') {
				$(this).find(settings.issuesDiv).width(widthIssue*howManyIssues);
				$(this).find(settings.datesDiv).width(widthDate*howManyDates).css('marginLeft',widthContainer/2-widthDate/2);
				var defaultPositionDates = parseInt($(this).find(settings.datesDiv).css('marginLeft').substring(0,$(this).find(settings.datesDiv).css('marginLeft').indexOf('px')));
			} else if(settings.orientation == 'vertical') {
				$(this).find(settings.issuesDiv).height(heightIssue*howManyIssues);
				$(this).find(settings.datesDiv).height(heightDate*howManyDates).css('marginTop',heightContainer/2-heightDate/2);
				var defaultPositionDates = parseInt($(this).find(settings.datesDiv).css('marginTop').substring(0,$(this).find(settings.datesDiv).css('marginTop').indexOf('px')));
			}

			$(this).find(settings.datesDiv+' a').on('click', function(event){
				event.preventDefault();

				// first vars
				var whichIssue = $(this).text();
				var currentIndex = $(this).parent().prevAll().length;

				console.log('currentIndex: ' + currentIndex)

				// moving the elements
				if(settings.orientation == 'horizontal') {
					$(this).parents(settings.containerDiv).find(settings.issuesDiv).animate({'marginLeft':-widthIssue*currentIndex},{queue:false, duration:settings.issuesSpeed});
				} else if(settings.orientation == 'vertical') {
					$(this).parents(settings.containerDiv).find(settings.issuesDiv).animate({'marginTop':-heightIssue*currentIndex},{queue:false, duration:settings.issuesSpeed});
				}
				$(this).parents(settings.containerDiv).find(settings.issuesDiv).find('li').animate({'opacity':settings.issuesTransparency},{queue:false, duration:settings.issuesSpeed}).removeClass(settings.issuesSelectedClass).eq(currentIndex).addClass(settings.issuesSelectedClass).fadeTo(settings.issuesTransparencySpeed,1);

				// prev/next buttons now disappears on first/last issue | bugfix from 0.9.51: lower than 1 issue hide the arrows | bugfixed: arrows not showing when jumping from first to last date
				if( howManyDates === 1 ) {
					//console.log('1')
					$(this).parents(settings.containerDiv).find(settings.prevButton + ',' + settings.nextButton).fadeOut('fast');
				} else if( howManyDates === 2 ) {
					//console.log('2')
					if($(this).parents(settings.containerDiv).find(settings.issuesDiv).find('li:first-child').hasClass(settings.issuesSelectedClass)) {
						//console.log('2, priuemro, tiene')
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeOut('fast');
					 	$(this).parents(settings.containerDiv).find(settings.nextButton).fadeIn('fast');
					} else if($(this).parents(settings.containerDiv).find(settings.issuesDiv).find('li:last-child').hasClass(settings.issuesSelectedClass)) {
						//console.log('2, ultimo, tiene')
						$(this).parents(settings.containerDiv).find(settings.nextButton).fadeOut('fast');
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeIn('fast');
					}
				} else {
					//console.log('otro')
					if( $(this).parents(settings.containerDiv).find(settings.issuesDiv).find('li:first-child').hasClass(settings.issuesSelectedClass) ) {
						//console.log('otro, priuemro, tiene')
						$(this).parents(settings.containerDiv).find(settings.nextButton).fadeIn('fast');
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeOut('fast');
					}
					else if( $(this).parents(settings.containerDiv).find(settings.issuesDiv).find('li:last-child').hasClass(settings.issuesSelectedClass) ) {
						//console.log('otro, ultimo  , tiene')
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeIn('fast');
						$(this).parents(settings.containerDiv).find(settings.nextButton).fadeOut('fast');
					}
					else {
						$(this).parents(settings.containerDiv).find(settings.nextButton + ',' + settings.prevButton).fadeIn('slow');
					}
				}
				// now moving the dates
				$(this).parents(settings.containerDiv).find(settings.datesDiv).find('a').removeClass(settings.datesSelectedClass);
				$(this).addClass(settings.datesSelectedClass);
				if(settings.orientation == 'horizontal') {
					$(this).parents(settings.containerDiv).find(settings.datesDiv).animate({'marginLeft':defaultPositionDates-(widthDate*currentIndex)},{queue:false, duration:settings.datesSpeed});
				} else if(settings.orientation == 'vertical') {
					$(this).parents(settings.containerDiv).find(settings.datesDiv).animate({'marginTop':defaultPositionDates-(heightDate*currentIndex)},{queue:false, duration:settings.datesSpeed});
				}
			});

			$(this).find(settings.nextButton).on('click', function(event){
				event.preventDefault();

				// bugixed from 0.9.54: now the dates gets centered when there's too much dates.
				var currentIndex = $(this).parents(settings.containerDiv).find(settings.issuesDiv).find('li.' + settings.issuesSelectedClass).index();
				console.log('currentIndex: ' + currentIndex)

				if(settings.orientation == 'horizontal') {
					var currentPositionIssues = parseInt($(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginLeft').substring(0,$(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginLeft').indexOf('px')));
					// var currentIssueIndex = currentPositionIssues/widthIssue;
					var currentPositionDates = parseInt($(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginLeft').substring(0,$(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginLeft').indexOf('px')));
					// var currentIssueDate = currentPositionDates-widthDate;
					//console.log('widthIssue: ' + widthIssue + ' | currentPositionIssues: ' + currentPositionIssues + ' | currentPositionDates: ' + currentPositionDates)
					
					if(currentPositionIssues <= -(widthIssue*howManyIssues-(widthIssue))) {
						console.log('ultimo')
						$(this).parents(settings.containerDiv).find(settings.issuesDiv).stop();
						$(this).parents(settings.containerDiv).find(settings.datesDiv+' li:last-child a').click();
					} else {
						if (!$(this).parents(settings.containerDiv).find(settings.issuesDiv).is(':animated')) {
							console.log('no ultimo, currentIndex: ' + currentIndex)
							// bugixed from 0.9.52: now the dates gets centered when there's too much dates.
							$(this).parents(settings.containerDiv).find(settings.datesDiv+' li').eq(currentIndex+1).find('a').trigger('click');
						}
					}
				} else if(settings.orientation == 'vertical') {
					var currentPositionIssues = parseInt($(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginTop').substring(0,$(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginTop').indexOf('px')));
					//var currentIssueIndex = currentPositionIssues/heightIssue;
					var currentPositionDates = parseInt($(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginTop').substring(0,$(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginTop').indexOf('px')));
					// var currentIssueDate = currentPositionDates-heightDate;

					if(currentPositionIssues <= -(heightIssue*howManyIssues-(heightIssue))) {
						$(this).parents(settings.containerDiv).find(settings.issuesDiv).stop();
						$(this).parents(settings.containerDiv).find(settings.datesDiv+' li:last-child a').click();
					} else {
						if (!$(this).parents(settings.containerDiv).find(settings.issuesDiv).is(':animated')) {
							// bugixed from 0.9.54: now the dates gets centered when there's too much dates.
							$(this).parents(settings.containerDiv).find(settings.datesDiv+' li').eq(currentIndex+1).find('a').trigger('click');
						}
					}
				}
				// prev/next buttons now disappears on first/last issue | bugfix from 0.9.51: lower than 1 issue hide the arrows
				// prev/next buttons now disappears on first/last issue | bugfix from 0.9.51: lower than 1 issue hide the arrows
				if(howManyDates == 1) {
					$(this).parents(settings.containerDiv).find(settings.prevButton+','+settings.nextButton).fadeOut('fast');
				} else if(howManyDates == 2) {
					if($(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass)) {
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeOut('fast');
					 	$(this).parents(settings.containerDiv).find(settings.nextButton).fadeIn('fast');
					} 
					else if($(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass)) {
						$(this).parents(settings.containerDiv).find(settings.nextButton).fadeOut('fast');
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeIn('fast');
					}
				} else {
					if( $(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass) ) {
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeOut('fast');
					} 
					else if( $(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass) ) {
						$(this).parents(settings.containerDiv).find(settings.nextButton).fadeOut('fast');
					}
					else {
						$(this).parents(settings.containerDiv).find(settings.nextButton+','+settings.prevButton).fadeIn('slow');
					}	
				}
			});

			$(this).find(settings.prevButton).on('click', function(event){
				event.preventDefault();
				// bugixed from 0.9.54: now the dates gets centered when there's too much dates.
				var currentIndex = $(this).parents(settings.containerDiv).find(settings.issuesDiv).find('li.' + settings.issuesSelectedClass).index();
				console.log(currentIndex)
				if(settings.orientation == 'horizontal') {
					var currentPositionIssues = parseInt($(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginLeft').substring(0,$(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginLeft').indexOf('px')));
					//var currentIssueIndex = currentPositionIssues/widthIssue;
					var currentPositionDates = parseInt($(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginLeft').substring(0,$(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginLeft').indexOf('px')));
					//var currentIssueDate = currentPositionDates+widthDate;

					if(currentPositionIssues >= 0) {
						$(this).parents(settings.containerDiv).find(settings.issuesDiv).stop();
						$(this).parents(settings.containerDiv).find(settings.datesDiv+' li:first-child a').click();
					} else {
						if (!$(this).parents(settings.containerDiv).find(settings.issuesDiv).is(':animated')) {
							// bugixed from 0.9.54: now the dates gets centered when there's too much dates.
							$(this).parents(settings.containerDiv).find(settings.datesDiv+' li').eq(currentIndex-1).find('a').trigger('click');
						}
					}
				} else if(settings.orientation == 'vertical') {
					var currentPositionIssues = parseInt($(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginTop').substring(0,$(this).parents(settings.containerDiv).find(settings.issuesDiv).css('marginTop').indexOf('px')));
					//var currentIssueIndex = currentPositionIssues/heightIssue;
					var currentPositionDates = parseInt($(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginTop').substring(0,$(this).parents(settings.containerDiv).find(settings.datesDiv).css('marginTop').indexOf('px')));
					//var currentIssueDate = currentPositionDates+heightDate;
					
					if(currentPositionIssues >= 0) {
						$(this).parents(settings.containerDiv).find(settings.issuesDiv).stop();
						$(this).parents(settings.containerDiv).find(settings.datesDiv+' li:first-child a').click();
					} else {
						if (!$(this).parents(settings.containerDiv).find(settings.issuesDiv).is(':animated')) {
							// bugixed from 0.9.54: now the dates gets centered when there's too much dates.
							$(this).parents(settings.containerDiv).find(settings.datesDiv+' li').eq(currentIndex-1).find('a').trigger('click');
						}
					}
				}
				// prev/next buttons now disappears on first/last issue | bugfix from 0.9.51: lower than 1 issue hide the arrows
				if(howManyDates == 1) {
					$(this).parents(settings.containerDiv).find(settings.prevButton+','+settings.nextButton).fadeOut('fast');
				} else if(howManyDates == 2) {
					if($(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass)) {
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeOut('fast');
					 	$(this).parents(settings.containerDiv).find(settings.nextButton).fadeIn('fast');
					}
					else if($(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass)) {
						$(this).parents(settings.containerDiv).find(settings.nextButton).fadeOut('fast');
						$(this).parents(settings.containerDiv).find(settings.prevButton).fadeIn('fast');
					}
				} else {
					if( $(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass) ) {
						$(this).find(settings.prevButton).fadeOut('fast');
					}
					else if( $(this).parents(settings.containerDiv).find(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass) ) {
						$(this).parents(settings.containerDiv).find(settings.nextButton).fadeOut('fast');
					} else {
						$(this).parents(settings.containerDiv).find(settings.nextButton+','+settings.prevButton).fadeIn('slow');
					}
				}
			});
			// keyboard navigation, added since 0.9.1
			if(settings.arrowKeys=='true') {
				if(settings.orientation=='horizontal') {
					$(document).keydown(function(event){
						if (event.keyCode == 39) {
					       $(this).find(settings.nextButton).click();
					    }
						if (event.keyCode == 37) {
					       $(this).find(settings.prevButton).click();
					    }
					});
				} else if(settings.orientation=='vertical') {
					$(document).keydown(function(event){
						if (event.keyCode == 40) {
					       $(this).find(settings.nextButton).click();
					    }
						if (event.keyCode == 38) {
					       $(this).find(settings.prevButton).click();
					    }
					});
				}
			}
			// default position startAt, added since 0.9.3
			$(this).find(settings.datesDiv+' li').eq(settings.startAt-1).find('a').trigger('click');
			// autoPlay, added since 0.9.4
			if(settings.autoPlay == 'true') {
				setInterval("autoPlay()", settings.autoPlayPause);
			}
		});
	});
};

// autoPlay, added since 0.9.4
function autoPlay(){
	var currentDate = $(this).find(settings.datesDiv).find('a.'+settings.datesSelectedClass);
	if(settings.autoPlayDirection == 'forward') {
		if(currentDate.parent().is('li:last-child')) {
			$(this).find(settings.datesDiv+' li:first-child').find('a').trigger('click');
		} else {
			currentDate.parent().next().find('a').trigger('click');
		}
	} else if(settings.autoPlayDirection == 'backward') {
		if(currentDate.parent().is('li:first-child')) {
			$(this).find(settings.datesDiv+' li:last-child').find('a').trigger('click');
		} else {
			currentDate.parent().prev().find('a').trigger('click');
		}
	}
}
