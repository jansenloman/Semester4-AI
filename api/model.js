/* @tensorflow/tfjs-node error terus karena tidak compat sama yang digunakan oleh toxicity
Versi yang di support @tensorflow-models/toxicity itu adalah @tensorflow/tfjs versi sekitar 1.3, mau coba tebak versi @tensorflow/tfjs sekarang?
4.4.0
Itu dah jauh kali, tentu saja ada banyak yang tidak compatible.

Yang jadi keterlaluan itu aku ingat ini awalnya bekerja waktu aku pakai. Kok jadi tidak bisa?? */
// require("@tensorflow/tfjs-node");
const toxicity = require('@tensorflow-models/toxicity');

/**
 * @typedef PredictionResult
 * @property {string} label
 * @property {{probabilities: Float32Array, match: boolean}[]} results
 */

/**
 * ToxicityDetectionModel is a wrapper around this model: https://github.com/tensorflow/tfjs-models/tree/master/toxicity
 * @class
 * @constructor
 * @public
 */
class ToxicityDetectionModel {
    constructor (model){
        this.model = model;
    }
    /**
     * Gives the raw predictions for the model in the form of PredictionResult.
     * PredictionResult is an object with a label property describing the type of toxicity, and a results property.
     * The results property contains the raw probabilities of being toxic/non-toxic for each input, as well as a match property.
     * The match property is either true (toxic), false (not toxic), or null (neither prediction exceeds the threshold)
     * @param {string[]} sentences 
     * @returns {PredictionResult[]}
     */
    async classify(sentences){
        return await this.model.classify(sentences);
    }
    /**
     * Returns whether the sentences are toxic or not, for any of the toxicity types. The indexes match the sentences. So if result index 0 is true, that means the sentence at index 0 is toxic.
     * @param {string[]} sentences 
     * @returns {boolean[]}
     */
    async isToxicMany(sentences){
        const predictions = await this.model.classify(sentences);
        const toxicity = sentences.map(() => false);
        for (let predict of predictions){
            for (let i = 0; i < toxicity.length; i++){
                toxicity[i] = toxicity[i] || predict.results[i].match;
            }
        }
        return toxicity;
    }
    /**
     * Convenience function using one string for isToxicMany()
     * @param {string} sentence 
     * @returns {boolean}
     */
    async isToxic(sentence){
        return (await this.isToxicMany([sentence]))[0];
    }
    /**
     * Returns the toxicity labels classified by the model
     * @param {string[]} sentences 
     * @returns {string[][]}
     */
    async whatToxicMany(sentences){
        const predictions = await this.model.classify(sentences);
        const results = sentences.map(() => new Array());
        for (let predict of predictions){
            for (let i = 0; i < predict.results.length; i++){
                if (predict.results[i].match){
                    results[i].push(predict.label)
                }
            }
        }
        return results;
    }
    /**
     * Convenience function using one string for whatToxicMany()
     * @param {string} sentence 
     */
    async whatToxic(sentence){
        return (await this.whatToxicMany([sentence]))[0];
    }
    static async load(confidence){
        return new ToxicityDetectionModel(await toxicity.load(confidence));
    }
}

const CONFIDENCE = 0.9;
let model;
/**
 * Loads the model asynchronously. It will take a long time for the initial load, but after the model has been loaded
 * it will simply return the previously loaded model.
 * @returns {ToxicityDetectionModel}
 */
async function loadModel(){
    if (model) return model;
    model = await ToxicityDetectionModel.load(CONFIDENCE);
    return model;
}

module.exports = {loadModel};