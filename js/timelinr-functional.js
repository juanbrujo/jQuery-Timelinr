/**
 * Timelinr - Modern ES6+ Timeline Component
 * 
 * A functional programming approach to creating interactive timelines.
 * Features:
 * - Horizontal or vertical orientation
 * - Keyboard navigation support
 * - Auto-play capability with continuous looping
 * - Smooth transitions and animations
 * - Responsive design
 * - Zero dependencies
 * 
 * When autoPlay is enabled:
 * - Forward direction: loops back to first element after last
 * - Backward direction: loops to last element after first
 * 
 * @author Jorge Epuñan H.
 * @license MIT
 * @example
 * // HTML: <div class="timelinr">...</div>
 * document.querySelectorAll('.timelinr').forEach(container => {
 *   const timeline = createTimelinr({
 *     orientation: 'horizontal',
 *     arrowKeys: true,
 *     autoPlay: false
 *   });
 *   const cleanup = timeline.init(container);
 * });
 */

const createTimelinr = (userOptions = {}) => {
    /**
     * Default configuration merged with user options.
     * All measurements are in pixels, speeds in milliseconds.
     */
    // Convert options to proper boolean values
    const normalizeOptions = (options) => {
        const normalizedOptions = {
            ...options,
            arrowKeys: Boolean(options.arrowKeys),
            autoPlay: Boolean(options.autoPlay),
            pauseOnHover: 'pauseOnHover' in options ? Boolean(options.pauseOnHover) : true
        };

        // Validate and warn about autoplay-related settings
        if (!normalizedOptions.autoPlay) {
            if ('autoPlayDirection' in options) {
                console.warn('Setting autoPlayDirection has no effect when autoPlay is false');
            }
            if ('autoPlayPause' in options) {
                console.warn('Setting autoPlayPause has no effect when autoPlay is false');
            }
            if ('pauseOnHover' in options) {
                console.warn('Setting pauseOnHover has no effect when autoPlay is false');
            }
            delete normalizedOptions.autoPlayDirection;
            delete normalizedOptions.autoPlayPause;
            delete normalizedOptions.pauseOnHover;
        } else {
            // Validate autoplay settings when autoPlay is true
            if (!options.autoPlayDirection) {
                console.warn('autoPlayDirection not set, using default: "forward"');
            } else if (!['forward', 'backward'].includes(options.autoPlayDirection)) {
                console.warn('Invalid autoPlayDirection value, must be "forward" or "backward". Using default: "forward"');
            }
            if (!options.autoPlayPause) {
                console.warn('autoPlayPause not set, using default: 2000ms');
            } else if (options.autoPlayPause < 500) {
                console.warn('autoPlayPause value is too low (< 500ms), this might cause performance issues');
            }
        }

        return normalizedOptions;
    };

    const settings = Object.assign({
        orientation: 'horizontal',
        datesSpeed: 300,
        issuesSpeed: 200,
        arrowKeys: false,
        startAt: 1,
        autoPlay: false,
        pauseOnHover: true
    }, normalizeOptions(userOptions));

    /**
     * Internal state management using closure.
     * Keeps track of current position, DOM elements, and runtime data.
     * Using const with mutable properties for better memory management.
     */
    const state = {
        currentIndex: settings.startAt - 1,
        autoPlayInterval: null,
        elements: null,
        dimensions: null
    };

    /**
     * Queries and returns all required DOM elements.
     * Pure function: Same selectors always return same elements.
     * Returns null for non-existent elements to allow safe optional chaining.
     * @returns {Object} Object containing all necessary DOM elements
     */
    const getDOMElements = (container) => {
        if (!container) {
            container = document.querySelector('.timelinr');
        }
        if (!container) return null;

        return {
            container,
            dates: container.querySelector('.timelinr-dates'),
            issues: container.querySelector('.timelinr-issues'),
            prevBtn: container.querySelector('.timelinr-prev'),
            nextBtn: container.querySelector('.timelinr-next'),
            dateItems: container.querySelectorAll('.timelinr-dates li'),
            issueItems: container.querySelectorAll('.timelinr-issues li')
        };
    };

    /**
     * Calculates all necessary dimensions for the timeline.
     * Pure function: Same elements always return same dimensions.
     * @param {Object} elements - DOM elements from getDOMElements
     * @returns {Object} Object containing all calculated dimensions
     */
    const calculateDimensions = elements => ({
        containerWidth: elements.container.offsetWidth,
        containerHeight: elements.container.offsetHeight,
        issueWidth: elements.issueItems[0].offsetWidth,
        issueHeight: elements.issueItems[0].offsetHeight,
        dateWidth: elements.dateItems[0].offsetWidth,
        dateHeight: elements.dateItems[0].offsetHeight,
        howManyDates: elements.dateItems.length,
        howManyIssues: elements.issueItems.length
    });

    /**
     * Sets up initial dimensions and positions for the timeline.
     * Handles both horizontal and vertical orientations.
     * Sets up CSS transitions for smooth animations.
     * @param {Object} elements - DOM elements
     * @param {Object} dimensions - Calculated dimensions
     */
    const setupDimensions = (elements, dimensions) => {
        if (!elements || !dimensions) return;
        
        const isHorizontal = settings.orientation === 'horizontal';
        
        // Set container sizes
        if (isHorizontal) {
            elements.issues.style.width = `${dimensions.issueWidth * dimensions.howManyIssues}px`;
            elements.dates.style.width = `${dimensions.dateWidth * dimensions.howManyDates}px`;
        } else {
            elements.issues.style.height = `${dimensions.issueHeight * dimensions.howManyIssues}px`;
            elements.dates.style.height = `${dimensions.dateHeight * dimensions.howManyDates}px`;
        }

        // Set up transitions for smooth animations with explicit properties
        elements.issues.style.transition = `margin ${settings.issuesSpeed}ms ease-in-out`;
        elements.dates.style.transition = `margin ${settings.datesSpeed}ms ease-in-out`;
        
        // Initial centering of the first date
        const centerPos = calculateCenterPosition(dimensions, state.currentIndex, isHorizontal);
        if (isHorizontal) {
            elements.dates.style.marginLeft = `${centerPos}px`;
        } else {
            elements.dates.style.marginTop = `${centerPos}px`;
        }
    };

    /**
     * Updates the position of both issues and dates containers.
     * Maintains center alignment of the current date.
     * Handles both horizontal and vertical layouts.
     * @param {Object} elements - DOM elements
     * @param {Object} dimensions - Calculated dimensions
     * @param {number} index - Current active index
     */
    /**
     * Calculates the center position for dates
     * @param {Object} dimensions - Timeline dimensions
     * @param {number} index - Current index
     * @param {boolean} isHorizontal - Orientation flag
     * @returns {number} The calculated center position
     */
    const calculateCenterPosition = (dimensions, index, isHorizontal) => {
        if (isHorizontal) {
            // For horizontal layout:
            // 1. Find the center of the container
            // 2. Calculate the position needed to center the current date
            // 3. Adjust for the sliding offset based on current index
            const containerCenter = dimensions.containerWidth / 2;
            const halfDateWidth = dimensions.dateWidth / 2;
            const totalOffset = dimensions.dateWidth * index;
            return containerCenter - totalOffset - halfDateWidth;
        } else {
            // Same logic for vertical layout
            const containerCenter = dimensions.containerHeight / 2;
            const halfDateHeight = dimensions.dateHeight / 2;
            const totalOffset = dimensions.dateHeight * index;
            return containerCenter - totalOffset - halfDateHeight;
        }
    };

    const updatePosition = (elements, dimensions, index) => {
        if (!elements || !dimensions) return;
        
        const isHorizontal = settings.orientation === 'horizontal';
        
        // Update issues container position
        if (isHorizontal) {
            elements.issues.style.marginLeft = `${-dimensions.issueWidth * index}px`;
        } else {
            elements.issues.style.marginTop = `${-dimensions.issueHeight * index}px`;
        }

        // Calculate and set the centered position for dates
        const centerPos = calculateCenterPosition(dimensions, index, isHorizontal);
        
        if (isHorizontal) {
            elements.dates.style.marginLeft = `${centerPos}px`;
        } else {
            elements.dates.style.marginTop = `${centerPos}px`;
        }
    };

    /**
     * Updates the visibility of navigation buttons based on current position.
     * Handles edge cases: single item, first item, last item.
     * @param {Object} elements - DOM elements including navigation buttons
     * @param {Object} dimensions - Timeline dimensions
     * @param {number} index - Current active index
     */
    const updateNavigation = (elements, dimensions, index) => {
        if (!elements.prevBtn || !elements.nextBtn) return;

        // If arrowKeys is false, hide navigation buttons completely
        if (!settings.arrowKeys) {
            elements.prevBtn.style.display = 'none';
            elements.nextBtn.style.display = 'none';
            return;
        }

        if (dimensions.howManyDates <= 1) {
            elements.prevBtn.style.display = 'none';
            elements.nextBtn.style.display = 'none';
        } else if (index === 0) {
            elements.prevBtn.style.display = 'none';
            elements.nextBtn.style.display = 'block';
        } else if (index === dimensions.howManyDates - 1) {
            elements.prevBtn.style.display = 'block';
            elements.nextBtn.style.display = 'none';
        } else {
            elements.prevBtn.style.display = 'block';
            elements.nextBtn.style.display = 'block';
        }
    };

    /**
     * Updates the selected state of dates and issues.
     * Handles transitions between old and new selections.
     * Manages CSS classes and opacity changes.
     * @param {Object} elements - DOM elements
     * @param {number} oldIndex - Previously selected index
     * @param {number} newIndex - Newly selected index
     */
    const SELECTED_CLASS = 'selected';

    const updateSelected = (elements, oldIndex, newIndex) => {
        // Safely handle old index elements
        if (oldIndex >= 0) {
            const oldDate = elements.dateItems[oldIndex];
            const oldIssue = elements.issueItems[oldIndex];
            
            // Update date item
            if (oldDate) {
                const oldLink = oldDate.querySelector('a');
                if (oldLink) {
                    oldLink.classList.remove(SELECTED_CLASS);
                }
            }
            
            // Update issue item
            if (oldIssue) {
                oldIssue.classList.remove(SELECTED_CLASS);
            }
        }

        // Safely handle new index elements
        const newDate = elements.dateItems[newIndex];
        const newIssue = elements.issueItems[newIndex];
        
        // Update date item
        if (newDate) {
            const newLink = newDate.querySelector('a');
            if (newLink) {
                newLink.classList.add(SELECTED_CLASS);
            }
        }
        
        // Update issue item
        if (newIssue) {
            newIssue.classList.add(SELECTED_CLASS);
        }
    };

    // Navigation functions
    const goToIndex = index => {
        // Validate state and index
        if (!state.elements || !state.dimensions) {
            console.warn('Timeline not properly initialized');
            return;
        }

        if (index < 0 || 
            index >= state.dimensions.howManyDates || 
            index === state.currentIndex) {
            return;
        }

        // Safe update of all components
        try {
            updateSelected(state.elements, state.currentIndex, index);
            state.currentIndex = index;
            updatePosition(state.elements, state.dimensions, index);
            updateNavigation(state.elements, state.dimensions, index);
        } catch (error) {
            console.error('Error updating timeline:', error);
        }
    };

    const next = () => {
        if (state.currentIndex < state.dimensions.howManyDates - 1) {
            goToIndex(state.currentIndex + 1);
        } else if (settings.autoPlay) {
            // If autoplay is on and we're at the last element, go to first
            goToIndex(0);
        }
    };

    const prev = () => {
        if (state.currentIndex > 0) {
            goToIndex(state.currentIndex - 1);
        } else if (settings.autoPlay) {
            // If autoplay is on and we're at the first element, go to last
            goToIndex(state.dimensions.howManyDates - 1);
        }
    };

    /**
     * Sets up all event listeners for the timeline.
     * Uses event delegation for better performance.
     * Includes click handlers, keyboard navigation, and cleanup.
     * @param {Object} elements - DOM elements
     * @returns {Function} Cleanup function to remove all event listeners
     */
    const setupEvents = (elements) => {
        const cleanupFunctions = [];

        // Date click events using event delegation
        elements.dates.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const clickedItem = e.target.closest('li');
                const index = Array.from(elements.dateItems).indexOf(clickedItem);
                if (index !== -1) goToIndex(index);
            }
        });

        // Setup navigation only if arrowKeys is enabled
        if (settings.arrowKeys && elements.prevBtn && elements.nextBtn) {
            // Navigation button events
            const handlePrevClick = e => {
                e.preventDefault();
                prev();
            };

            const handleNextClick = e => {
                e.preventDefault();
                next();
            };

            elements.prevBtn.addEventListener('click', handlePrevClick);
            elements.nextBtn.addEventListener('click', handleNextClick);

            cleanupFunctions.push(() => {
                elements.prevBtn.removeEventListener('click', handlePrevClick);
                elements.nextBtn.removeEventListener('click', handleNextClick);
            });

            // Keyboard navigation
            const handleKeyPress = e => {
                if (e.key === 'ArrowLeft') prev();
                else if (e.key === 'ArrowRight') next();
            };

            document.addEventListener('keydown', handleKeyPress);
            cleanupFunctions.push(() => {
                document.removeEventListener('keydown', handleKeyPress);
            });
        }

        // Return a cleanup function that handles all event listeners
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    };

    /**
     * Configures autoplay functionality if enabled.
     * Supports both forward and backward directions.
     * Includes automatic cleanup of intervals.
     * @returns {Function} Cleanup function to clear the autoplay interval
     */
    const setupAutoPlay = () => {
        if (!settings.autoPlay) return () => {};

        // Use default values if settings are not provided
        const direction = settings.autoPlayDirection || 'forward';
        const pause = Math.max(500, parseInt(settings.autoPlayPause) || 2000);
        
        let animationFrameId = null;
        let lastTime = 0;
        let isPlaying = false;

        const animate = (currentTime) => {
            if (!isPlaying) return;

            if (!lastTime) lastTime = currentTime;
            const deltaTime = currentTime - lastTime;

            if (deltaTime >= pause) {
                direction === 'forward' ? next() : prev();
                lastTime = currentTime;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const startInterval = () => {
            if (isPlaying) return;
            isPlaying = true;
            lastTime = 0;
            animationFrameId = requestAnimationFrame(animate);
        };

        const stopInterval = () => {
            isPlaying = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            lastTime = 0;
        };

        // Start initial autoplay
        startInterval();

        // Setup pause on hover if enabled
        if (settings.pauseOnHover && state.elements.container) {
            state.elements.container.addEventListener('mouseenter', stopInterval);
            state.elements.container.addEventListener('mouseleave', startInterval);
            
            // Add visibility change handling
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    stopInterval();
                } else {
                    startInterval();
                }
            });

            // Return cleanup function that removes event listeners
            return () => {
                stopInterval();
                state.elements.container.removeEventListener('mouseenter', stopInterval);
                state.elements.container.removeEventListener('mouseleave', startInterval);
                document.removeEventListener('visibilitychange', stopInterval);
            };
        }

        // Return basic cleanup if pauseOnHover is disabled
        return () => {
            stopInterval();
            document.removeEventListener('visibilitychange', stopInterval);
        };
    };

    /**
     * Initializes the timeline component.
     * Sets up all necessary components in the correct order:
     * 1. Gets DOM elements
     * 2. Calculates dimensions
     * 3. Sets up initial layout
     * 4. Configures events and autoplay
     * 
     * @returns {Function|null} Cleanup function or null if initialization fails
     */
    const init = (container) => {
        state.elements = getDOMElements(container);
        
        if (!state.elements?.container || 
            !state.elements.dates || 
            !state.elements.issues) {
            console.error('Required elements not found');
            return null;
        }

        state.dimensions = calculateDimensions(state.elements);
        
        setupDimensions(state.elements, state.dimensions);
        updateSelected(state.elements, -1, state.currentIndex);
        updatePosition(state.elements, state.dimensions, state.currentIndex);
        updateNavigation(state.elements, state.dimensions, state.currentIndex);
        
        const cleanupEvents = setupEvents(state.elements);
        const cleanupAutoplay = setupAutoPlay();

        // Return cleanup function
        return () => {
            cleanupEvents();
            cleanupAutoplay();
        };
    };

    /**
     * Public API for the timeline.
     * Provides methods for initialization and navigation.
     * All methods are bound to their scope and safe to use as callbacks.
     * @returns {Object} Public methods and properties
     */
    return {
        init,
        next,
        prev,
        goToIndex,
        getCurrentIndex: () => state.currentIndex,
        getSettings: () => ({...settings})
    };
};

// Export for both module systems and global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createTimelinr;
} else {
    window.createTimelinr = createTimelinr;
}