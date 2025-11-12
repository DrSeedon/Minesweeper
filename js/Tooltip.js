export class Tooltip {
    constructor() {
        this.tooltip = document.getElementById('tooltip');
        this.showTimeout = null;
        this.hideTimeout = null;
        this.currentElement = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.initListeners();
    }
    
    initListeners() {
        document.addEventListener('mouseenter', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target && target !== this.currentElement) {
                this.showTooltip(target, e);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target && target === this.currentElement) {
                this.hideTooltip();
            }
        }, true);
        
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            if (this.currentElement && this.tooltip.classList.contains('show')) {
                this.updatePosition();
            }
        });
    }
    
    showTooltip(element, event) {
        this.currentElement = element;
        const text = element.dataset.tooltip;
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        
        clearTimeout(this.hideTimeout);
        clearTimeout(this.showTimeout);
        
        this.showTimeout = setTimeout(() => {
            if (this.currentElement === element) {
                this.tooltip.textContent = text;
                this.updatePosition();
                this.tooltip.classList.add('show');
            }
        }, 500);
    }
    
    hideTooltip() {
        this.currentElement = null;
        clearTimeout(this.showTimeout);
        
        this.tooltip.classList.remove('show');
    }
    
    updatePosition() {
        const offset = 15;
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let left = this.mouseX + offset;
        let top = this.mouseY + offset;
        
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = this.mouseX - tooltipRect.width - offset;
        }
        
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = this.mouseY - tooltipRect.height - offset;
        }
        
        left = Math.max(10, left);
        top = Math.max(10, top);
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }
}

