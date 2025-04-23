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

/** Pixel Reference
 * 
 * Seperate from Pixel Data in that changing its value will update
 * the value in the image as well.
 * 
 */
interface PixelReference {
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
        value: PixelReference
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

    private getRef(i:number):PixelReference {
        const img = this._iamge.data;
        return {
            get red() {
                return img[i]
            },
            set red(n:number){
                if(n < 0)
                    img[i] = 0;
                else if (n > 255)
                    img[i] = 255;
                else
                    img[i] = n;
            },
            get green() {
                return img[i+1]
            },
            set green(n:number){
                if(n < 0)
                    img[i+1] = 0;
                else if (n > 255)
                    img[i+1] = 255;
                else
                    img[i+1] = n;
            },
            get blue() {
                return img[i+2]
            },
            set blue(n:number){
                if(n < 0)
                    img[i+2] = 0;
                else if (n > 255)
                    img[i+2] = 255;
                else
                    img[i+2] = n;
            },
            get alpha() {
                return img[i+3]
            },
            set alpha(n:number){
                if(n < 0)
                    img[i+3] = 0;
                else if (n > 255)
                    img[i+3] = 255;
                else
                    img[i+3] = n;
            }
        }
    }

    [Symbol.iterator]():PixelMatrixIterator {
        const maxLength = this._iamge.data.length;
        const self = this;
        return {
            i: 0,
            next() {
                if(this.i < maxLength) {
                    const value = self.getRef(this.i);
                    this.i += 4;
                    return {
                        value,
                        done: false
                    }
                }

                return {done:true, value:<any>null}
            }
        }
    }
}