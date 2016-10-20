/*
 *  jQuery Timelinr - v1.0.0
 *  Dando vida al tiempo / Giving life to time
 *
 *  https://github.com/juanbrujo/jQuery-Timelinr
 *  Demo: http://www.csslab.cl/2011/08/18/jquery-timelinr/
 *
 *  Author: Jorge Epuñan |  @csslab
 *  License: MIT
 *  ©2016
 */
;(function ($, window, document, undefined) {

  "use strict";

  $.fn.timelinr = function(options) {

    // Options

    var settings = $.extend({
      autoplay : true,
      startOn : 0,
      speed : 3000,
      transition : 400,
      arrows : true,
      dates: true,
      direction: 'forward' // forward | backward
    }, options);

    return this.each(function() {

  // Variables

    var wrapper         = $(this),
        slides          = wrapper.children().wrapAll('<div class="timelinr"/>').addClass('timelinr-issue'),
        slider          = wrapper.find('.timelinr'),
        slide_count     = slides.length,
        transition      = settings.transition,
        starting_slide  = settings.startOn,
        target          = starting_slide > slide_count - 1 ? 0 : starting_slide,
        direction       = settings.direction,
        animating       = false,
        clicked,
        timer,
        key,
        prev,
        next,

        // Reset autoplay

        reset_timer     = settings.autoplay ? function() {
          var slideDirection = direction === 'backward' ? prev_slide : next_slide;
          clearTimeout(timer);
          timer = setTimeout(slideDirection, settings.speed);
        } : $.noop;


  // Animate Slider

    function get_height(target) {
      return slides.eq(target).height();
    }

    function animate_slide(target) {
      if (!animating) {
        animating = true;
        var target_slide = slides.eq(target);

        target_slide.fadeIn(transition).addClass('timelinr-issue-active');
        slides.not(target_slide).fadeOut(transition).removeClass('timelinr-issue-active');;

        slider.animate({height: get_height(target)}, transition,  function() {
          animating = false;
        });

        reset_timer();

      }};

    // Next Slide

      function next_slide() {
        target = target === slide_count - 1 ? 0 : target + 1;
        animate_slide(target);
      }

    // Prev Slide

      function prev_slide() {
        target = target === 0 ? slide_count - 1 : target - 1;
        animate_slide(target);
      }

      if (settings.arrows) {
        slider.append('<button class="timelinr-nav timelinr-prev"/>', '<button class="timelinr-nav timelinr-next"/>');
      }

      if (settings.dates) {
        var dates = '<div class="timelinr-dates">';
        var count = 0;
        slides.each(function(){
          var date = $(this).data('timelinr-date') || $(this).index() + 1;
          count = date;
          if ($(this).index() == starting_slide) {
            dates += '<a href="#timelinr-' + count + '" class="timelinr-date timelinr-date-active">' + count + '</a>';
          } else {
            dates += '<a href="#timelinr-' + count + '" class="timelinr-date">' + count + '</a>';
          }
          $(this).attr('id', 'timelinr-' + date);
        });
        dates += '</div>';
        slider.append(dates);
      }

      next = slider.find('.timelinr-next'),
      prev = slider.find('.timelinr-prev');

      $(window).load(function() {

        slider.css({height: get_height(target)}).on('click', function(e) {
          clicked = $(e.target);
          if (clicked.is(next)) { 
            next_slide() 
          } else if (clicked.is(prev)) { 
            prev_slide() 
          }
        });

        animate_slide(target);

        slider.find('.timelinr-dates > a').on('click', function(){
          var which = $(this).index();
          //reset_timer();
          animate_slide(which);

          $(this).addClass('timelinr-date-active').siblings().removeClass('timelinr-date-active');
        });

        $(document).keydown(function(e) {
          key = e.keyCode;
          if (key === 39) { 
            next_slide();
          } else if (key === 37) { 
            prev_slide(); 
          }
        });

      });

    });

  };

})(jQuery, window, document);