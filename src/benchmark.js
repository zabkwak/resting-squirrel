export default class Benchmark {

    get total() {
        const b = this.toJSON();
        return b.total;
    }

    _name = null;
    _map = {};
    _started = false;

    constructor(name) {
        this._name = name;
    }

    start() {
        if (this._started) {
            throw new Error('Benchmark already started');
        }
        this._started = true;
        return this.mark('start'); 
    }

    mark(label) {
        this._map[label] = new Date();
        return this;
    }

    toJSON() {
        const o = {};
        let prev = null;
        let sum = 0;
        Object.keys(this._map).forEach((key) => {
            const d = this._map[key];
            if (prev === null) {
                prev = key;
                return;
            }
            const t = this._map[prev];
            const diff = d.getTime() - t.getTime();
            o[key] = diff;
            sum += diff;
            prev = key;
        });
        o.total = sum;
        return o;
    }
}
