/**
 * Timelinr - Functional Version
 * A modern ES6+ timeline component using functional programming principles
 * @author Original by CSSLab.cl, modernized by GitHub Copilot
 * @license MIT
 */

const createTimelinr = (userOptions = {}) => {
    // Default settings with user overrides
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

    // State management using closure
    const state = {
        currentIndex: settings.startAt - 1,
        autoPlayInterval: null,
        elements: null,
        dimensions: null
    };

    // Pure function to get all required DOM elements
    const getDOMElements = () => ({
        container: document.querySelector(settings.containerDiv),
        dates: document.querySelector(settings.datesDiv),
        issues: document.querySelector(settings.issuesDiv),
        prevBtn: document.querySelector(settings.prevButton),
        nextBtn: document.querySelector(settings.nextButton),
        dateItems: document.querySelectorAll(`${settings.datesDiv} li`),
        issueItems: document.querySelectorAll(`${settings.issuesDiv} li`)
    });

    // Pure function to calculate dimensions
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

    // Pure function to setup dimensions
    const setupDimensions = (elements, dimensions) => {
        const isHorizontal = settings.orientation === 'horizontal';
        
        if (isHorizontal) {
            elements.issues.style.width = `${dimensions.issueWidth * dimensions.howManyIssues}px`;
            elements.dates.style.width = `${dimensions.dateWidth * dimensions.howManyDates}px`;
            elements.dates.style.marginLeft = `${dimensions.containerWidth/2 - dimensions.dateWidth/2}px`;
        } else {
            elements.issues.style.height = `${dimensions.issueHeight * dimensions.howManyIssues}px`;
            elements.dates.style.height = `${dimensions.dateHeight * dimensions.howManyDates}px`;
            elements.dates.style.marginTop = `${dimensions.containerHeight/2 - dimensions.dateHeight/2}px`;
        }

        elements.issues.style.transition = `all ${settings.issuesSpeed}ms ease-in-out`;
        elements.dates.style.transition = `all ${settings.datesSpeed}ms ease-in-out`;
    };

    // Pure function to update positions
    const updatePosition = (elements, dimensions, index) => {
        const isHorizontal = settings.orientation === 'horizontal';
        
        if (isHorizontal) {
            elements.issues.style.marginLeft = `${-dimensions.issueWidth * index}px`;
            const defaultPosition = parseInt(getComputedStyle(elements.dates).marginLeft);
            elements.dates.style.marginLeft = `${defaultPosition - (dimensions.dateWidth * index)}px`;
        } else {
            elements.issues.style.marginTop = `${-dimensions.issueHeight * index}px`;
            const defaultPosition = parseInt(getComputedStyle(elements.dates).marginTop);
            elements.dates.style.marginTop = `${defaultPosition - (dimensions.dateHeight * index)}px`;
        }
    };

    // Pure function to update navigation visibility
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

    // Pure function to update selected state
    const updateSelected = (elements, oldIndex, newIndex) => {
        elements.dateItems[oldIndex]?.querySelector('a')
            .classList.remove(settings.datesSelectedClass);
        elements.issueItems[oldIndex]?.classList
            .remove(settings.issuesSelectedClass);
        elements.issueItems[oldIndex].style.opacity = settings.issuesTransparency;

        elements.dateItems[newIndex]?.querySelector('a')
            .classList.add(settings.datesSelectedClass);
        elements.issueItems[newIndex]?.classList
            .add(settings.issuesSelectedClass);
        elements.issueItems[newIndex].style.opacity = 1;
    };

    // Navigation functions
    const goToIndex = index => {
        if (index < 0 || 
            index >= state.dimensions.howManyDates || 
            index === state.currentIndex) {
            return;
        }

        updateSelected(state.elements, state.currentIndex, index);
        state.currentIndex = index;
        updatePosition(state.elements, state.dimensions, index);
        updateNavigation(state.elements, state.dimensions, index);
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

    // Event handling setup
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

    // Autoplay setup
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

    // Initialize timeline
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

    // Public API
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