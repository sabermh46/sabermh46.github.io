(() => {
    const widthsc = document.documentElement.clientWidth;

    /**
     * Generates an array of {x, y} coordinates for the first half of an even number of elements
     * arranged in a perfect circle.
     * The remaining half will be mirrored during rendering.
     * Starts from the right (0 degrees) and goes clockwise for the first half.
     * @param {number} numElements - The total number of even elements.
     * @returns {Array<{x: number, y: number}>} An array of coordinate objects for the first half.
     */
    function generateEvenCircleHalfCoordinates(numElements) {
        if (numElements % 2 !== 0) {
            console.warn("generateEvenCircleHalfCoordinates called with an odd number of elements. This function is optimized for even numbers only.");
            return [];
        }

        const coordinates = [];
        const numHalf = numElements / 2;
        const angleStep = Math.PI / numHalf; // Angle for half a circle (180 degrees) divided by half the elements

        for (let i = 0; i < numHalf; i++) {
            const angle = i * angleStep;
            coordinates.push({
                x: Math.cos(angle),
                y: Math.sin(angle)
            });
        }
        return coordinates;
    }

    /**
     * Generates an array of {x, y} coordinates for an odd number of elements
     * arranged in a perfect circle.
     * Starts with an element at the top (12 o'clock / -90 degrees) for visual balance.
     * @param {number} numElements - The total number of odd elements to arrange in a circle.
     * @returns {Array<{x: number, y: number}>} An array of coordinate objects.
     */
    function generateOddCircleCoordinates(numElements) {
        if (numElements % 2 === 0) {
            console.warn("generateOddCircleCoordinates called with an even number of elements. This function is optimized for odd numbers only.");
            return [];
        }

        const coordinates = [];
        const angleStep = (2 * Math.PI) / numElements;
        const startAngle = -Math.PI / 2;

        for (let i = 0; i < numElements; i++) {
            const angle = startAngle + (i * angleStep);
            coordinates.push({
                x: Math.cos(angle),
                y: Math.sin(angle)
            });
        }
        return coordinates;
    }

    /**
     * Initializes and manages a circular arrangement of icon cards within a given grid element.
     * @param {HTMLElement} gridElement - The parent grid element containing the icon cards.
     * @param {object} options - Configuration options.
     * @param {number} options.rMultiplier - Base factor for radius calculation (e.g., 2).
     * @param {number} options.minRadius - Minimum radius in pixels (e.g., 30).
     * @param {number} options.maxRadius - Maximum radius in pixels (e.g., 110 for small screens, 180 for large).
     */
    function initCircleGrid(gridElement, options = {}) {
        const defaultOptions = {
            rMultiplier: 2,
            minRadius: 30,
            maxRadius: widthsc <= 768 ? 110 : 180,
            minElements: 2,
            maxElements: 16
        };
        const settings = { ...defaultOptions,
            ...options
        };

        const cards = Array.from(gridElement.querySelectorAll('.icon-card'));

        if (cards.length < settings.minElements) {
            console.warn(`Grid requires at least ${settings.minElements} cards to form a circle. Found ${cards.length}.`, gridElement);
            return;
        }

        const effectiveNumElements = Math.min(Math.max(cards.length, settings.minElements), settings.maxElements);

        let baseCoordinates;
        let isEven = false;
        let numHalfCards = 0;

        if (effectiveNumElements % 2 === 0) {
            baseCoordinates = generateEvenCircleHalfCoordinates(effectiveNumElements);
            isEven = true;
            numHalfCards = effectiveNumElements / 2;
        } else {
            baseCoordinates = generateOddCircleCoordinates(effectiveNumElements);
        }

        let animationFrameId;

        function frame() {
            const rect = gridElement.getBoundingClientRect();
            const vh = window.innerHeight;

            let pct = (vh - rect.top) / vh;
            pct = Math.min(1, Math.max(0, pct));

            let radius = settings.rMultiplier * (pct * 100);
            radius = Math.max(settings.minRadius, Math.min(settings.maxRadius, radius));

            if (isEven) {
                for (let i = 0; i < numHalfCards; i++) {
                    const card = cards[i];
                    const mirroredCard = cards[i + numHalfCards];

                    if (!card || !mirroredCard) {
                        console.warn(`Missing card for index ${i} or its mirror ${i + numHalfCards}. This might indicate an issue with card indexing/order.`, gridElement);
                        continue;
                    }

                    const {
                        x,
                        y
                    } = baseCoordinates[i];

                    // Calculate tx, ty for the current card
                    const tx = x * radius;
                    const ty = y * radius;

                    // Apply transform to the current card
                    card.style.transform = `translate(-50%, -50%) translate3d(${tx}px, ${ty}px, 0)`;

                    // Apply transform to its mirrored counterpart by directly negating tx and ty
                    mirroredCard.style.transform = `translate(-50%, -50%) translate3d(${-tx}px, ${-ty}px, 0)`;
                }
            } else {
                cards.forEach((card) => { // Removed idx as it's not directly used here
                    const i = +card.dataset.index - 1;
                    if (i >= 0 && i < baseCoordinates.length) {
                        const {
                            x,
                            y
                        } = baseCoordinates[i];
                        const tx = x * radius;
                        const ty = y * radius;
                        card.style.transform = `translate(-50%, -50%) translate3d(${tx}px, ${ty}px, 0)`;
                    } else {
                        card.style.transform = `translate(-50%, -50%) translate3d(0, 0, 0)`;
                    }
                });
            }

            animationFrameId = requestAnimationFrame(frame);
        }

        animationFrameId = requestAnimationFrame(frame);

        return {
            stop: () => cancelAnimationFrame(animationFrameId)
        };
    }

    // --- Initialization for all .tech-grid elements ---
    const techGrids = document.querySelectorAll('.tech-grid');
    techGrids.forEach(grid => {
        initCircleGrid(grid);
    });

})();