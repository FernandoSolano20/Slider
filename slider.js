class Slider{
    #template = `<div data-element-scrolled="#index" class="swiper-slide"><img src="#url"></div>`
    #container = null;
    #arrowRight = null;
    #arrowLeft = null;
    #scrollElement = null;
    #currentIndex = 0;
    #items = null;
    #numberItems = 0;
    #observer = null;

    constructor(parameters) {
        if (!parameters.container) {
            return;
        }

        this.#container = parameters.container;
        this.#arrowRight = this.#container.querySelector('[data-arrow-right]');
        this.#arrowLeft = this.#container.querySelector('[data-arrow-left]');
        this.#scrollElement = this.#container.querySelector('[data-scroll]') || this.container;
        this.#items = JSON.parse(this.#container.querySelector('[data-items]').innerText).Items;

        if (!this.#arrowRight || !this.#arrowLeft || !this.#scrollElement || !this.#items) {
            return;
        }


        setTimeout(()=>{
            this.#checkBrokenImages(0);
        this.#numberItems = this.#items.length - 1;
        this.#paintNextElement();
        this.#container.addEventListener('click', this.#move.bind(this));
        this.#showArrows();
        }, 1000)
    }

    #checkBrokenImages(index){
        const imgError = this.#container.querySelector('[data-error="true"]');
        if (imgError) {
            imgError.closest('[data-element-scrolled]').remove();
            this.#items.splice(index, 1);
            this.#numberItems = this.#items.length - 1;
            this.#paintNextElement();
            return;
        }
    }

    #onError(options){
        const { index, paintBackUpImage } = options;
        this.#container.querySelector(`[data-element-scrolled="${index}"]`).remove();
        this.#items.splice(index, 1);
        this.#numberItems = this.#items.length - 1;
        paintBackUpImage.call(this);
        this.#showArrows();
    }

    #createItem(options) {
        const { url, index, paintBackUpImage } = options;
        const item = this.#template
        .replace('#url', url)
        .replace('#index', index);
        const fragment = document.createRange().createContextualFragment(item);
        const onErrorOptions = {
            index,
            paintBackUpImage,
        };
        fragment.querySelector('img').addEventListener('error', this.#onError.bind(this, onErrorOptions));
        return fragment;
    }

    #paintPreviousElement() {
        if (this.#currentIndex > 0 && this.#numberItems > 1 && this.#currentIndex !== this.#numberItems) {
            const prevoiusIndex = this.#currentIndex - 1;
            const url = this.#items[prevoiusIndex];
            const options = {
                url,
                index: prevoiusIndex, 
                paintBackUpImage: this.#paintPreviousElement,
            };
            this.#scrollElement.prepend(this.#createItem(options));
        }
    }

    #paintNextElement() {
        if (this.#numberItems > 0 && this.#currentIndex !== this.#numberItems) {
            const nextIndex = this.#currentIndex + 1;
            const url = this.#items[nextIndex];
            const options = {
                url,
                index: nextIndex, 
                paintBackUpImage: this.#paintNextElement,
            };
            this.#scrollElement.appendChild(this.#createItem(options));
        }
    }

    #removePreviousElement() {
        if (this.#currentIndex > 1 && this.#numberItems > 1 && this.#currentIndex !== 0) {
            this.#container.querySelector('[data-element-scrolled]').remove();
        }
    }

    #removeNextElement() {
        if (this.#numberItems > 1 && this.#currentIndex !== this.#numberItems-1) {
            this.#container.querySelector('[data-element-scrolled]:last-child').remove();
        }
    }

    #calculateMove(elementToMove) {
        const shouldMove = this.#container.querySelectorAll('[data-element-scrolled]').length === 2
        && (this.#currentIndex === 1 || this.#currentIndex === 0);
        return shouldMove ? elementToMove.getBoundingClientRect().width : 0;
    }

    #move(event) {
        const arrow = event.target.closest('[data-arrow]');
        if (arrow) {
            const isLeftArrow = !!arrow.dataset.arrowLeft;
            if (isLeftArrow && this.#currentIndex - 1 > 0) {
                this.#currentIndex--;
                this.#paintPreviousElement();
                this.#removeNextElement();
                const move = this.#calculateMove(this.#container.querySelector('[data-element-scrolled]'));
                this.#scrollElement.scrollBy(-move, 0);
            }
            else if (this.#currentIndex + 1 < this.#numberItems){
                this.#currentIndex++;
                const move = this.#calculateMove(this.#container.querySelector('[data-element-scrolled]:last-child'));
                this.#scrollElement.scrollBy(move, 0);
                this.#paintNextElement();
                this.#removePreviousElement();
            }
            this.#showArrows();
        }
    }

    #showArrows() {
        if (this.#currentIndex === 0) {
            this.#arrowLeft.setAttribute('hidden', '');
        } else {
            this.#arrowLeft.removeAttribute('hidden');
        }

        if (this.#currentIndex === this.#numberItems) {
            this.#arrowRight.setAttribute('hidden', '');
        } else {
            this.#arrowRight.removeAttribute('hidden');
        }
    }

    #initIntersectionObserver() {
        let options = {
            root: this.#scrollElement,
            rootMargin: '0px',
            threshold: 1.0
        }
        this.#observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.intersectionRatio > 0 && entry.isIntersecting) {
                    if (this.#scrollElement === 0 && this.#currentIndex - 1 >= 0) {
                        this.#currentIndex--;
                        this.#paintPreviousElement();
                        this.#removeNextElement();
                        const move = entry.target.getBoundingClientRect().width;
                        this.#scrollElement.scrollBy(move, 0);
                        return;
                    }

                    if (this.#scrollElement === entry.target.clientWidth * 2 && this.#currentIndex + 1 < this.#numberItems) {
                        this.#currentIndex++;
                        const move = entry.target.getBoundingClientRect().width;
                        this.#scrollElement.scrollBy(move, 0);
                        this.#paintNextElement();
                        this.#removePreviousElement();;
                        return;
                    }
                }
            });
        }, options);
    }
}