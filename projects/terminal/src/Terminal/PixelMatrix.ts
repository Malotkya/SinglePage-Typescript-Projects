/** /Terminal/PixelMatrix
 * 
 * @author Alex Malotky
 */

/** Pixel Data
 * 
 */
interface PixelData {
    red:number,
    green:number,
    blue:number,
    alpha:number
}

/** Pixel Matrix Iterator
 * 
 */
interface PixelMatrixIterator {
    i: number
    next:()=>{
        done: boolean
        value: PixelData
    }
}

/** Pixel Matrix
 * 
 * An abstraction around ImageData that makes interactng with 
 * image.data easier.
 */
export default class PixelMatrix {
    private _iamge:ImageData;

    constructor(data:ImageData) {
        this._iamge = data;
    }

    get(x:number, y:number):PixelData {
        if(x < 0 || x >= this._iamge.width)
            throw new TypeError("X is out of bounds!");

        if(y < 0 || y >= this._iamge.height)
            throw new TypeError("Y is out of bounds!");

        const i = (x * this._iamge.width) + y;
        return {
            red:   this._iamge.data[i],
            green: this._iamge.data[i+1],
            blue:  this._iamge.data[i+2],
            alpha: this._iamge.data[i+3]
        }
    }

    set(x:number, y:number, red:number, green:number, blue:number, alpha?:number){
        if(x < 0 || x >= this._iamge.width)
            throw new TypeError("X is out of bounds!");

        if(y < 0 || y >= this._iamge.height)
            throw new TypeError("Y is out of bounds!");

        const i = (x * this._iamge.width) + y;
        this._iamge.data[i]   = red;
        this._iamge.data[i+1] = green;
        this._iamge.data[i+2] = blue;
        if(alpha)
            this._iamge.data[i+3] = alpha;
    }

    [Symbol.iterator]():PixelMatrixIterator {
        const img = this._iamge.data;
        return {
            i: 0,
            next() {
                if(this.i < img.length) {
                    const i = this.i;
                    this.i += 4;
                    return {
                        value: {
                            get red() {
                                return img[i]
                            },
                            get green() {
                                return img[i+1]
                            },
                            get blue() {
                                return img[i+2]
                            },
                            get alpha() {
                                return img[i+3]
                            },
                            set red(n:number) {
                                img[i] = n;
                            },
                            set green(n:number) {
                                img[i+1] = n;
                            },
                            set blue(n:number) {
                                img[i+2] = n;
                            },
                            set alpha(n:number) {
                                img[i+3] = n;
                            }
                        },
                        done: false
                    }
                }

                return {done:true, value:<any>null}
            }
        }
    }
}