/**
 * Timelinr - Modern ES6+ Timeline Component
 * 
 * A functional programming approach to creating interactive timelines.
 * Features:
 * - Horizontal or vertical orientation
 * - Keyboard navigation support
 * - Auto-play capability
 * - Smooth transitions and animations
 * - Responsive design
 * - Zero dependencies
 * 
 * @author Original by CSSLab.cl, modernized to functional version
 * @license MIT
 * @example
 * const timeline = createTimelinr({
 *   orientation: 'horizontal',
 *   arrowKeys: 'true'
 * });
 * const cleanup = timeline.init();
 */

const createTimelinr = (userOptions = {}) => {
    /**
     * Default configuration merged with user options.
     * All measurements are in pixels, speeds in milliseconds.
     */
    const settings = Object.assign({
        orientation: 'horizontal',
        containerDiv: '#timeline',
        datesDiv: '#dates',
        datesSelectedClass: 'selected',
        datesSpeed: 300,
        issuesDiv: '#issues',
        issuesSelectedClass: 'selected',
        issuesSpeed: 200,
        issuesTransparency: 0.2,
        issuesTransparencySpeed: 500,
        prevButton: '#prev',
        nextButton: '#next',
        arrowKeys: false,
        startAt: 1,
        autoPlay: false,
        autoPlayDirection: 'forward',
        autoPlayPause: 2000
    }, userOptions);

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
    const getDOMElements = () => ({
        container: document.querySelector(settings.containerDiv),
        dates: document.querySelector(settings.datesDiv),
        issues: document.querySelector(settings.issuesDiv),
        prevBtn: document.querySelector(settings.prevButton),
        nextBtn: document.querySelector(settings.nextButton),
        dateItems: document.querySelectorAll(`${settings.datesDiv} li`),
        issueItems: document.querySelectorAll(`${settings.issuesDiv} li`)
    });

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

        // Set up transitions for smooth animations
        elements.issues.style.transition = `all ${settings.issuesSpeed}ms ease-in-out`;
        elements.dates.style.transition = `all ${settings.datesSpeed}ms ease-in-out`;
        
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
    const updateSelected = (elements, oldIndex, newIndex) => {
        // Safely handle old index elements
        if (oldIndex >= 0) {
            const oldDate = elements.dateItems[oldIndex];
            const oldIssue = elements.issueItems[oldIndex];
            
            // Update date item
            if (oldDate) {
                const oldLink = oldDate.querySelector('a');
                if (oldLink) {
                    oldLink.classList.remove(settings.datesSelectedClass);
                }
            }
            
            // Update issue item
            if (oldIssue) {
                oldIssue.classList.remove(settings.issuesSelectedClass);
                oldIssue.style.opacity = settings.issuesTransparency;
            }
        }

        // Safely handle new index elements
        const newDate = elements.dateItems[newIndex];
        const newIssue = elements.issueItems[newIndex];
        
        // Update date item
        if (newDate) {
            const newLink = newDate.querySelector('a');
            if (newLink) {
                newLink.classList.add(settings.datesSelectedClass);
            }
        }
        
        // Update issue item
        if (newIssue) {
            newIssue.classList.add(settings.issuesSelectedClass);
            newIssue.style.opacity = '1';
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
        }
    };

    const prev = () => {
        if (state.currentIndex > 0) {
            goToIndex(state.currentIndex - 1);
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
        // Date click events using event delegation
        elements.dates.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const clickedItem = e.target.closest('li');
                const index = Array.from(elements.dateItems).indexOf(clickedItem);
                if (index !== -1) goToIndex(index);
            }
        });

        // Navigation button events
        elements.prevBtn?.addEventListener('click', e => {
            e.preventDefault();
            prev();
        });

        elements.nextBtn?.addEventListener('click', e => {
            e.preventDefault();
            next();
        });

        // Keyboard navigation
        if (settings.arrowKeys === 'true') {
            const handleKeyPress = e => {
                if (e.key === 'ArrowLeft') prev();
                else if (e.key === 'ArrowRight') next();
            };
            document.addEventListener('keydown', handleKeyPress);
            return () => document.removeEventListener('keydown', handleKeyPress);
        }
        return () => {};
    };

    /**
     * Configures autoplay functionality if enabled.
     * Supports both forward and backward directions.
     * Includes automatic cleanup of intervals.
     * @returns {Function} Cleanup function to clear the autoplay interval
     */
    const setupAutoPlay = () => {
        if (settings.autoPlay === 'true') {
            state.autoPlayInterval = setInterval(
                () => settings.autoPlayDirection === 'forward' ? next() : prev(),
                parseInt(settings.autoPlayPause)
            );
            return () => clearInterval(state.autoPlayInterval);
        }
        return () => {};
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
    const init = () => {
        state.elements = getDOMElements();
        
        if (!state.elements.container || 
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