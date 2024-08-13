const {model, loadModel} = require("./api/model");

const sentences = [
    "You suck!",
    "We're dudes on computers, moron. You are quite astonishingly stupid.",
    "Please stop. If you continue to vandalize Wikipedia, as you did to Kmart, you will be blocked from editing.",
    "I respect your point of view, and when this discussion originated on 8th April I would have tended to agree with you",
    "sgidshgdkslghsdgkdsg",
    "Bodoh amat elo",
];
(async function(){
    const model = await loadModel();

    for (let i = 0; i < 100; i++){
        for (let sentence of sentences){
            console.log(sentence);
            console.log("Toxicity: ", await model.isToxic(sentence));
            console.log("Classification: ", await model.classify(sentence));
            console.log("Types: ", await model.whatToxic(sentence));
        }
    }
})();
