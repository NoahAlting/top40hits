function dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
}

// toggle_featgenre from buttonstrip: https://www.cssscript.com/inline-toggle-button-buttonstrip/

function buttonstrip(options) {
    this.id = options.id;
    this.buttons = [];
}

buttonstrip.prototype.addButton = function(pName, pActive, pType, pCallback) {
    this.buttons.push({
        name: pName,
        active: pActive,
        event: {
            type: pType,
            callback: pCallback
        }
    });
}

buttonstrip.prototype.append = function(element) {
    var rootDiv = document.createElement('div');
    rootDiv.classList.add('button-strip');
    rootDiv.id = this.id;

    for (var i = 0; i < this.buttons.length; i++) {
        var self = this;
        var button = this.buttons[i];

        var innerSpan = document.createElement('span');
        innerSpan.classList.add('strip-button-text');
        innerSpan.innerHTML = button.name;

        var buttonDiv = document.createElement('div');
        buttonDiv.classList.add('strip-button');
        var stripButtonClassIterator = 'strip-button-' + i.toString();
        buttonDiv.classList.add(stripButtonClassIterator);
        if (button.active) {
            buttonDiv.classList.add('active-strip-button');
            this.activeSelector = '#' + this.id + ' .' + stripButtonClassIterator;
        }
        buttonDiv.appendChild(innerSpan);
        buttonDiv.addEventListener(button.event.type, button.event.callback);
        buttonDiv.addEventListener('click', function(){
            document.querySelector(self.activeSelector).classList.remove('active-strip-button');
            document.querySelector('#' + self.id + ' .' + this.classList[1]).classList.add('active-strip-button');
            self.activeSelector = '#' + self.id + ' .' + this.classList[1];
        });

        rootDiv.appendChild(buttonDiv);
    }
    
    document.querySelector(element).appendChild(rootDiv);
}


// =================================== Own code for global variable ========================================
document.addEventListener("DOMContentLoaded", () => {
    const buttonStrip = document.getElementById("toggleType");

    buttonStrip.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON") {
            const buttons = buttonStrip.querySelectorAll("button");
            buttons.forEach((button) => button.classList.remove("active"));

            const clickedButton = event.target;
            clickedButton.classList.add("active");

            window.selectedType = clickedButton.getAttribute("data-toggle");
            console.log("Selected Option (global):", window.selectedType);
            dispatchCustomEvent('typeUpdated', { type: selectedType });
        }
    });
});

// ============================================ Top SELECTOR =================================================
document.addEventListener("DOMContentLoaded", () => {
    const buttonStripTop = document.getElementById("toggleTop");

    buttonStripTop.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON") {
            const buttons = buttonStripTop.querySelectorAll("button");
            buttons.forEach((button) => button.classList.remove("active"));

            const clickedButton = event.target;
            clickedButton.classList.add("active");

            // Update the global selectedTop value
            window.selectedTop = parseInt(clickedButton.getAttribute("data-toggle").replace("top", ""));
            console.log("Selected Top (global):", window.selectedTop);

            // Dispatch a custom event for selectedTop update
            dispatchCustomEvent('topUpdated', { top: window.selectedTop });
        }
    });
});