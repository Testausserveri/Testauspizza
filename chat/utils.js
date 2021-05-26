const api = require('../kotipizza/api');

function defaultState() {
    return {
        state: undefined,
        orderId: undefined,
        buyerId: 0,
        orderItems: [],
        contact: {
            street: undefined,
            postalCode: undefined,
            city: undefined,
            emailMarketingPermission: false,
            smsMarketingPermission: false,
            receiveSMSNotification: false,
            coordinates: {
                longitude: undefined, latitude: undefined
            },
            deliveryDistance: 1
        },
        deliveryType: undefined,
        paymentMethod: undefined,
        preOrderTime: undefined,
        shopId: undefined,
        hotspotId: -1,
        redirectToOrderTracking: true,
        temp: defaultTemp()
    }
}

function defaultTemp() {
    return {
        currentProduct: undefined,
        currentSize: undefined,
        ingredients: []
    }
}

function calculatePrice(product) {
    return new Promise((resolve, reject) => {
        let calcPrice = product.product.price || product.price;
        let ingredientsPrice = 0;
        let ingredientsWithPrice = [];
        api.getIngredients().then(ingredients => {
            product.ingredients.forEach(ingredient => {
                ingredients.forEach(lIngredient => {
                    if (ingredient.id === lIngredient.ingredientID) {
                        let ingredientDosing = lIngredient.ingredientdosings.filter(item => {return item.productSizeID === product.size.productSizeID && item.active});
                        if (ingredientDosing.length > 0) {
                            ingredientDosing = ingredientDosing[0];
                            ingredientsPrice += ingredientDosing.priceWithVAT;
                            ingredientsWithPrice.push('('+lIngredient.ingredientID+') '+lIngredient.name+`, ${ingredientDosing.priceWithVAT}€`)
                        }
                    }
                })
            });
            resolve({price: (ingredientsPrice!==0?ingredientsPrice:calcPrice), ingredients: ingredientsWithPrice.join(", ")||'Ei ainesosia'});
        }).catch(err => {reject(err)});
    })
}

const global = {
    selectSize: "Valitse koko komennolla `!size <numero>`. Jos haluat nähdä valitun pizzan, kirjoita komento `!pizza`.",
    sessionCommands: "Voit hakea tuotteita komennolla `!search hakusana`, valita pizzan komennolla `!select <pizzanumero>`, ja perua tilauksen komennolla `!cancel`.\nSuosituimmat pizzat saat komennolla `!popular`\nListaa ostoskori komennolla `!cart`, poista tuote ostoskorista komennolla `!rs <numero>`\nKun olet valinnut tuotteet, siirry tilaamaan komennolla `!order`",
    ingredientCommands: "Voit poistaa ainesosan komennolla `!ri <numero>`, lisätä ainesosan `!ai <numero>`\nhakea ainesosia `!si <hakusana>` (halutessasi voit lisätä kategorian tähän)\nlistata kategoriat komennolla `!ki`\nja listata valitut ainesosat komennolla `!li`\nKun olet valmis/et halua valita lisäainesosia, syötä komento `!add` lisätäksesi tuotteen listalle."
}

const templates = {
    error: "😢 Jokin meni pieleen, yritä myöhemmin uudelleen",
    startSession: "Aloita tilaus komennolla !pizza",
    welcome: "**Tervetuloa!**\n"+global.sessionCommands,
    done: "👍",
    sessionCommands: global.sessionCommands,
    productNotFound: "Tuotetta ei löytynyt. Syötitkö väärän numeron?",
    sizeNotFound: "Kokonumero on virheellinen. Syötitkö väärän numeron?",
    ingredientNotFound: "Ainesosanumero on virheellinen. Syötitkö väärän numeron?",
    invalidQuery: "Virheellinen hakusana! Hakutermin on oltava vähintään 3 merkkiä.",
    searchNotFound: "🤔 Haku ei tuottanut tuloksia. Kenties väärä hakusana?",
    noProductSelected: "Et ole valinnut tuotteita. Valitse tuote komennolla `!select <numero>`",
    selectSize: global.selectSize,
    noSizeSelected: "Et ole valinnut kokoa. "+global.selectSize,
    welcomingIngredientCommands: "Yllä näet valitut ainesosat.\n"+global.ingredientCommands,
    ingredientCommands: global.ingredientCommands,
    continueShopping: "Voit jatkaa muiden tuotteiden lisäystä, listata ostoskorin komennolla `!cart`, poista tuote ostoskorista komennolla `!rs <numero>` tai jatkaa kassaan komennolla `!order`",
    cartCommands: "Ostoskorista voi poistaa tuotteen komennolla `!rs <numero>`"
}

module.exports = {
    defaultState,
    templates,
    defaultTemp,
    calculatePrice
}