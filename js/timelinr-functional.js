/**
 * Timelinr - Modern ES6+ Timeline Component
 * 
 * A functional programming approach to creating interactive timelines.
 * Built with modern JavaScript practices and zero dependencies.
 * 
 * @module Timelinr
 * @author Jorge Epuñan H.
 * @license MIT
 * @version 1.0.0
 * 
 * @typedef {Object} TimelinrOptions
 * @property {string} [orientation='horizontal'] - Timeline orientation ('horizontal' or 'vertical')
 * @property {number} [datesSpeed=300] - Animation speed for dates in milliseconds
 * @property {number} [issuesSpeed=200] - Animation speed for issues in milliseconds
 * @property {boolean} [arrowKeys=true] - Enable navigation buttons
 * @property {number} [startAt=1] - Starting position (1-based index)
 * @property {boolean} [autoPlay=false] - Enable automatic cycling through timeline items
 * @property {string} [autoPlayDirection='forward'] - Direction of autoplay ('forward' or 'backward')
 * @property {number} [autoPlayPause=2000] - Pause between transitions in milliseconds
 * @property {boolean} [pauseOnHover=true] - Pause autoplay when hovering over timeline
 * 
 * @typedef {Object} TimelinrAPI
 * @property {function(HTMLElement): Function} init - Initialize the timeline
 * @property {function(): void} next - Move to next item
 * @property {function(): void} prev - Move to previous item
 * @property {function(number): void} goToIndex - Go to specific index
 * @property {function(): number} getCurrentIndex - Get current position
 * @property {function(): TimelinrOptions} getSettings - Get current settings
 * 
 * Features:
 * - Horizontal or vertical orientation
 * - Navigation button support
 * - Auto-play capability with continuous looping
 * - Smooth transitions and animations
 * - Responsive design
 * - Zero dependencies
 * 
 * Required HTML Structure:
 * ```html
 * <div class="timelinr">
 *   <ul class="timelinr-issues">
 *     <li data-date="1900">Content 1</li>
 *     <li data-date="2000">Content 2</li>
 *   </ul>
 * </div>
 * ```
 * 
 * @example
 * // Basic initialization
 * document.querySelectorAll('.timelinr').forEach(container => {
 *   const timeline = createTimelinr({
 *     orientation: 'horizontal',
 *     arrowKeys: true, // Enable navigation buttons
 *     autoPlay: false
 *   });
 *   const cleanup = timeline.init(container);
 * });
 * 
 * @example
 * // With autoplay
 * const timeline = createTimelinr({
 *   autoPlay: true,
 *   autoPlayDirection: 'forward',
 *   autoPlayPause: 3000,
 *   pauseOnHover: true
 * });
 */

/**
 * Creates a new Timelinr instance with the specified options.
 * 
 * @function createTimelinr
 * @param {TimelinrOptions} [userOptions={}] - Configuration options for the timeline
 * @returns {TimelinrAPI} Timeline control methods and properties
 * @throws {Error} If required DOM elements are not found during initialization
 */
const createTimelinr = (userOptions = {}) => {
    /**
     * Default configuration merged with user options.
     * All measurements are in pixels, speeds in milliseconds.
     */
    // Convert options to proper boolean values
    /**
 * Normalizes and validates user options, providing warnings for invalid settings.
 * 
 * @private
 * @param {TimelinrOptions} options - Raw user options
 * @returns {TimelinrOptions} Normalized options with proper types and defaults
 */
    const normalizeOptions = (options) => {
        const normalizedOptions = {
            ...options,
            arrowKeys: Boolean(options.arrowKeys),
            autoPlay: Boolean(options.autoPlay),
            pauseOnHover: 'pauseOnHover' in options ? Boolean(options.pauseOnHover) : true,
            datesPosition: options.datesPosition?.toLowerCase() === 'below' ? 'below' : 'above'
        };

        // Validate datesPosition when orientation is not horizontal
        if (options.orientation && options.orientation !== 'horizontal' && options.datesPosition) {
            console.warn('datesPosition setting only applies when orientation is horizontal');
        }        
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
        datesPosition: 'above', // 'above' or 'below', only used when orientation is horizontal
        datesSpeed: 300,
        issuesSpeed: 200,
        arrowKeys: true,
        startAt: 1,
        autoPlay: false,
        pauseOnHover: false
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
    /**
     * Creates the dates navigation from issues' data-date attributes
     * @private
     * @param {HTMLElement} container - Timeline container element
     * @param {NodeList} issueItems - List of issue items
     * @returns {HTMLElement} The created dates container
     */
    const createDatesFromIssues = (container, issueItems) => {
        // Create dates container
        const datesContainer = document.createElement('ul');
        datesContainer.className = 'timelinr-dates';
        
        // Convert NodeList to Array to use Array methods
        Array.from(issueItems).forEach(issue => {
            const date = issue.getAttribute('data-date');
            if (date) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = date;
                li.appendChild(a);
                datesContainer.appendChild(li);
            }
        });

        // Position the dates container based on settings
        if (settings.orientation === 'horizontal') {
            if (settings.datesPosition === 'below') {
                // Insert after issues
                container.querySelector('.timelinr-issues').after(datesContainer);
            } else {
                // Insert at the beginning (above)
                container.insertBefore(datesContainer, container.firstChild);
            }
        } else {
            // For vertical orientation, always insert at the beginning
            container.insertBefore(datesContainer, container.firstChild);
        }
        
        // Add position class for styling
        container.classList.add(`timelinr-dates-${settings.orientation === 'horizontal' ? (settings.datesPosition === 'above' ? 'top' : 'bottom') : 'left'}`);
        
        return datesContainer;
    };

    /**
     * Creates navigation arrows for the timeline
     * @private
     * @param {HTMLElement} container - Timeline container element
     * @returns {Object} Object containing the created navigation buttons
     */
    const createNavigationArrows = (container) => {
        if (!settings.arrowKeys) {
            return { prevBtn: null, nextBtn: null };
        }

        // Create prev button
        const prevBtn = document.createElement('a');
        prevBtn.href = '#';
        prevBtn.className = 'timelinr-prev';
        prevBtn.textContent = '−';
        
        // Create next button
        const nextBtn = document.createElement('a');
        nextBtn.href = '#';
        nextBtn.className = 'timelinr-next';
        nextBtn.textContent = '+';
        
        // Add buttons to container
        container.appendChild(prevBtn);
        container.appendChild(nextBtn);
        
        return { prevBtn, nextBtn };
    };

    /**
     * Gets all required DOM elements for the timeline
     * @private
     * @param {HTMLElement} container - Timeline container element
     * @returns {Object|null} Object containing all necessary DOM elements or null if invalid
     */
    const getDOMElements = (container) => {
        if (!container) {
            container = document.querySelector('.timelinr');
        }
        if (!container) return null;

        const issues = container.querySelector('.timelinr-issues');
        const issueItems = issues?.querySelectorAll('li');
        
        if (!issues || !issueItems.length) {
            console.error('Required timeline issues not found');
            return null;
        }

        // Create dates dynamically from issues
        const dates = createDatesFromIssues(container, issueItems);
        
        // Create navigation arrows if enabled
        const { prevBtn, nextBtn } = createNavigationArrows(container);
        
        return {
            container,
            dates,
            issues,
            prevBtn,
            nextBtn,
            dateItems: dates.querySelectorAll('li'),
            issueItems
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

    /**
 * Updates the position of issues and dates containers based on the current index.
 * 
 * @private
 * @param {Object} elements - DOM elements object
 * @param {HTMLElement} elements.issues - Issues container element
 * @param {HTMLElement} elements.dates - Dates container element
 * @param {Object} dimensions - Timeline dimensions
 * @param {number} dimensions.issueWidth - Width of each issue
 * @param {number} dimensions.issueHeight - Height of each issue
 * @param {number} index - Current active index
 */
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
    /**
 * Navigates to a specific index in the timeline.
 * Updates selected items, positions, and navigation state.
 * 
 * @private
 * @param {number} index - Target index to navigate to
 * @throws {Error} If timeline is not properly initialized
 */
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

    /**
 * Moves to the next item in the timeline.
 * Loops to first item if autoPlay is enabled and currently at last item.
 * 
 * @private
 */
const next = () => {
        if (state.currentIndex < state.dimensions.howManyDates - 1) {
            goToIndex(state.currentIndex + 1);
        } else if (settings.autoPlay) {
            // If autoplay is on and we're at the last element, go to first
            goToIndex(0);
        }
    };

    /**
 * Moves to the previous item in the timeline.
 * Loops to last item if autoPlay is enabled and currently at first item.
 * 
 * @private
 */
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
     * Includes click handlers, navigation buttons, and cleanup.
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
    /**
 * Configures and initializes the autoplay functionality.
 * Uses requestAnimationFrame for smooth animations and better performance.
 * 
 * @private
 * @returns {Function} Cleanup function that removes all autoplay-related event listeners
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

        // Add orientation-specific class
        if (settings.orientation === 'vertical') {
            container.classList.add('timelinr-vertical');
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