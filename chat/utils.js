const api = require('../kotipizza/api');

function defaultState() {
    return {
        state: undefined,
        orderId: undefined,
        buyerId: 0,
        orderItems: [],
        contact: defaultContact(),
        deliveryType: undefined,
        paymentMethod: undefined,
        preOrderTime: undefined,
        shop: undefined,
        hotspotId: -1,
        redirectToOrderTracking: true,
        temp: defaultTemp(),
        timing: undefined,
        order: undefined
    }
}

function defaultTemp() {
    return {
        currentProduct: undefined,
        currentSize: undefined,
        ingredients: []
    }
}

function defaultContact() {
    return {
        street: undefined,
        postalCode: undefined,
        city: undefined,
        emailMarketingPermission: false,
        smsMarketingPermission: false,
        receiveSMSNotification: true,
        coordinates: {
            longitude: undefined, latitude: undefined
        },
        email: undefined,
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        deliveryDistance: 1
    }
}

function calculatePrice(product) {
    return new Promise((resolve, reject) => {
        let calcPrice = product.product.price || product.price;
        let ingredientsPrice = 0.00;
        let ingredientsWithPrice = [];
        api.getIngredients().then(ingredients => {
            product.ingredients.forEach(ingredient => {
                ingredients.forEach(lIngredient => {
                    if (ingredient.id === lIngredient.ingredientID) {
                        let ingredientDosing = lIngredient.ingredientdosings.filter(item => {return item.productSizeID === product.size.productSizeID && item.active});
                        if (ingredientDosing.length > 0) {
                            ingredientDosing = ingredientDosing[0];
                            ingredientsPrice += ingredientDosing.priceWithVAT;
                            console.log(ingredientDosing.priceWithVAT);
                            console.log(ingredientsWithPrice);
                            ingredientsWithPrice.push(lIngredient.name+`, ${ingredientDosing.priceWithVAT}€`)
                        }
                    }
                })
            });
            resolve({price: (ingredientsPrice!==0?ingredientsPrice:calcPrice), ingredients: ingredientsWithPrice.join(", ")||'Ei ainesosia'});
        }).catch(err => {reject(err)});
    })
}

function convertStateToOrderBody(state) {
    let model = {
        orderItems: [],
        deliveryContact: state.contact,
        buyerId: state.buyerId,
        deliveryType: state.deliveryType,
        hasPhoneOrderFee: false,
        hotspotId: state.hotspotId,
        orderID: state.orderId,
        preOrderTime: state.preOrderTime,
        promotionCodes: [],
        redirectToOrderTracking: state.redirectToOrderTracking,
        redirectUrl: "https://www.kotipizza.fi/tilaus/tulos",
        paymentMethod: undefined,
        shopId: state.shop.restaurantId
    }
    state.orderItems.forEach(item => {
        let itemModel = {
            additionalText: "Tilattu Testauspizzan kautta",
            productId: item.product.productID,
            quantity: 1,
            sizeId: item.size.productSizeID,
            ingredients: []
        }
        item.ingredients.forEach(ingredient => {
            itemModel.ingredients.push({ingredientId: ingredient.id, dosingId: ingredient.dosingId, quantity: 1});
        })
        model.orderItems.push(itemModel);
    });
    return model;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRestaurantLink(shop) {
    return 'https://kotipizza.fi/ravintolat/'+shop.displayName.toLowerCase()
        .replace(/(\s|_|\||,|:|\(|\))/g, "-")
        .replace(/(---|--)/g, "-")
        .replace(/-$/g, "");
}

const global = {
    selectSize: "Valitse koko komennolla `!size <numero>`. Jos haluat nähdä valitun pizzan, kirjoita komento `!pizza`.",
    sessionCommands: "Voit hakea tuotteita komennolla `/search`, valita pizzan komennolla `/select`, ja perua tilauksen komennolla `/cancel`.\nSuosituimmat pizzat saat komennolla `/popular`\nListaa ostoskori komennolla `/cart`, poista tuote ostoskorista komennolla `/rs`\nKun olet valinnut tuotteet, siirry tilaamaan komennolla `/order`",
    ingredientCommands: "Voit poistaa ainesosan komennolla `!ri <numero>`, lisätä ainesosan `!ai <numero>`\nhakea ainesosia `!si <hakusana>` (halutessasi voit lisätä kategorian tähän)\nlistata kategoriat komennolla `!ki`\nja listata valitut ainesosat komennolla `!li`\nKun olet valmis/et halua valita lisäainesosia, syötä komento `!add` lisätäksesi tuotteen listalle."
}

const templates = {
    error: "😢 Jokin meni pieleen, yritä myöhemmin uudelleen",
    luckFailed: "😢 Tällä kertaa kävi huono tuuri, yritä myöhemmin uudelleen",
    startSession: "Aloita tilaus komennolla /pizza",
    welcome: "**Tervetuloa!**\n"+global.sessionCommands,
    done: "👍",
    selectDeletableCartItem: "Valitse poistettava tuote",
    sessionCommands: global.sessionCommands,
    productNotFound: "Tuotetta ei löytynyt. Syötitkö väärän numeron?",
    sizeNotFound: "Kokonumero on virheellinen. Syötitkö väärän numeron?",
    ingredientNotFound: "Ainesosanumero on virheellinen. Syötitkö väärän numeron?",
    invalidQuery: "Virheellinen hakusana! Hakutermin on oltava vähintään 3 merkkiä.",
    searchNotFound: "🤔 Haku ei tuottanut tuloksia. Kenties väärä hakusana?",
    noProductSelected: "Et ole valinnut tuotteita. Valitse tuote komennolla `!select <numero>`",
    selectSize: global.selectSize,
    noSizeSelected: "Et ole valinnut kokoa. "+global.selectSize,
    welcomingIngredientCommands: "Yllä näet valitut ainesosat.\n",
    ingredientCommands: global.ingredientCommands,
    continueShopping: "Voit jatkaa muiden tuotteiden lisäystä, listata ostoskorin komennolla `!cart`, poista tuote ostoskorista komennolla `!rs <numero>` tai jatkaa kassaan komennolla `!order`",
    cartCommands: "Ostoskorista voi poistaa tuotteen komennolla `/poistakori`",
    orderingGuide: "Haluatko kuljetusta, syötkö Kotipizzan ravintolassa vai noudatko ravintolasta?",
    locationNotFound: "🤔 Hakusanalla tai osoittella ei löytynyt tuloksia. Kokeile uudelleen toisella hakusanalla.",
    osmNote: "Testauspizza | © OpenStreetMapin tekijät",
    searching: "🔎 Haetaan...",
    searchShop: "🔎 Hae Kotipizza ravintola syöttämällä hakusana:",
    searchNearestShop: "🔎 Haetaan lähimmät ravintolat...",
    enterDeliveryAddress: "🗺️ Syötä toimitusosoite muodossa (<Osoite>, <Postinumero>, <Kaupunki>)",
    invalidAddressFormat: "Osoitteen muoto ei ole oikein. Oikea muoto: <Osoite>, <Postinumero>, <Kaupunki>",
    selectLocation: "Valitse ravintola",
    noPickupLocationForDelivery: "⚠️Osoitteelle ei löytynyt toimitukselle ravintoloita. Valitse toinen toimitusvaihtoehto, esim. nouto tai ravintolassa syöminen.",
    invalidDelType: "Väärä toimitustapa, ",
    delOptions: "Haluatko tilata heti vai tehdä ennakkotilauksen?\nVastaa `heti` tai `ennakkotilaus`.",
    contactInfo: {
        name: "Syötä etunimesi:",
        surname: "Syötä sukunimesi:",
        email: "Syötä sähköpostiosoitteesi:",
        phone: "Syötä puhelinnumerosi:"
    },
    orderNeedsPayment: "Tilauksesi on tehty. Siirry maksamaan haluamasi maksutavalla. Sinut uudelleenohjataan tilauksenseurantasivulle.",
    paymentMethod: "Maksu:",
    noPointsAvailable: "⚠️Valitettavasti saatavilla olevat Kotipizza-ravintolat ovat kiinni ja/tai ei hyväksy nykyistä toimitusehtoa. Kokeile vaihtaa toimitustapa tai ravintolan hakusana."
}

const constants = {
    deliveryTypes: {
        eatInStore: "eatin",
        delivery: "delivery",
        pickup: "pickup",
        hotStop: "hotspot"
    },
    timings: {
        now: 'now',
        ennakkotilaus: 'time_selection'
    },
    paymentGroups: {
        lunchcard: "Lounasetu",
        onsite: "Maksu noutaessa",
        giftcards: "Lahjakortit",
        mobile: "Mobiilimaksu",
        bank: "Verkkopankki",
        creditcard: "Luottokortit"
    }
}

const resolvePaymentGroupName = (method) => {
    if (constants.paymentGroups[method.group])
        return constants.paymentGroups[method.group];
    else
        return "Maksutapa"
}

module.exports = {
    defaultState,
    templates,
    defaultTemp,
    calculatePrice,
    constants,
    capitalizeFirstLetter,
    getRestaurantLink,
    defaultContact,
    convertStateToOrderBody,
    resolvePaymentGroupName
}