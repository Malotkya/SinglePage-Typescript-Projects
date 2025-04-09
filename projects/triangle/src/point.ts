export type Point = {
    x: number,
    y: number
}

export class Triangle {
    private _list:Point[];

    constructor(width:number, height:number){
        this._list = [];
        this.init(width, height);
    }

    private init(width:number, height:number):void {
        this._list.push({
            x: width/2,
            y: 0
        });
        this._list.push({
            x: 0,
            y:  height-1
        });
        this._list.push({
            x: width-1,
            y: height-1
        });
    }

    private random():Point {
        return this._list[Math.floor(Math.random() * this._list.length)];
    }

    start(width:number, height:number):Point {
        this._list = [];
        this.init(width, height);

        let r1 = Math.random();
        let r2 = Math.random();

        let x = (1 - Math.sqrt(r1)) * this._list[0].x +
                (Math.sqrt(r1) * (1 - r2)) * this._list[1].x +
                (Math.sqrt(r1) * r2) * this._list[2].x;

        let y = (1 - Math.sqrt(r1)) * this._list[0].y +
                (Math.sqrt(r1) * (1 - r2)) * this._list[1].y +
                (Math.sqrt(r1) * r2) * this._list[2].y;

        return {
            x: Math.round(x),
            y: Math.round(y)
        };
    }

    next(last:Point):Point {
        const r = this.random();
        return {
            x: Math.round((last.x + r.x) / 2),
            y: Math.round((last.y + r.y) / 2)
        }
    }
}