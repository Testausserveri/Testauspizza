class AsyncIterator {

    constructor(callback, endCallback, items) {
        this.currentItem = -1;
        this.items = items;
        this._callback = callback;
        this._endCallback = endCallback;
    }


    set callback(value) {
        this._callback = value;
    }

    nextItem() {
        if (this.currentItem+1 < this.items.length) {
            this.currentItem++;
            this._callback(this.items[this.currentItem], this.currentItem);
        } else {
            this._endCallback()
        }
    }

    set endCallback(value) {
        this._endCallback = value;
    }
}

module.exports = {
    AsyncIterator
}