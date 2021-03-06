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
                            ingredientsWithPrice.push(lIngredient.name+`, ${ingredientDosing.priceWithVAT}???`)
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
    selectSize: "Valitse koko komennolla `!size <numero>`. Jos haluat n??hd?? valitun pizzan, kirjoita komento `!pizza`.",
    sessionCommands: "Voit hakea tuotteita komennolla `/search`, valita pizzan komennolla `/select`, ja perua tilauksen komennolla `/cancel`.\nSuosituimmat pizzat saat komennolla `/popular`\nListaa ostoskori komennolla `/cart`, poista tuote ostoskorista komennolla `/rs`\nKun olet valinnut tuotteet, siirry tilaamaan komennolla `/order`",
    ingredientCommands: "Voit poistaa ainesosan komennolla `!ri <numero>`, lis??t?? ainesosan `!ai <numero>`\nhakea ainesosia `!si <hakusana>` (halutessasi voit lis??t?? kategorian t??h??n)\nlistata kategoriat komennolla `!ki`\nja listata valitut ainesosat komennolla `!li`\nKun olet valmis/et halua valita lis??ainesosia, sy??t?? komento `!add` lis??t??ksesi tuotteen listalle."
}

const templates = {
    error: "???? Jokin meni pieleen, yrit?? my??hemmin uudelleen",
    luckFailed: "???? T??ll?? kertaa k??vi huono tuuri, yrit?? my??hemmin uudelleen",
    startSession: "Aloita tilaus komennolla /pizza",
    welcome: "**Tervetuloa!**\n"+global.sessionCommands,
    done: "????",
    selectDeletableCartItem: "Valitse poistettava tuote",
    sessionCommands: global.sessionCommands,
    productNotFound: "Tuotetta ei l??ytynyt. Sy??titk?? v????r??n numeron?",
    sizeNotFound: "Kokonumero on virheellinen. Sy??titk?? v????r??n numeron?",
    ingredientNotFound: "Ainesosanumero on virheellinen. Sy??titk?? v????r??n numeron?",
    invalidQuery: "Virheellinen hakusana! Hakutermin on oltava v??hint????n 3 merkki??.",
    searchNotFound: "???? Haku ei tuottanut tuloksia. Kenties v????r?? hakusana?",
    noProductSelected: "Et ole valinnut tuotteita. Valitse tuote komennolla `!select <numero>`",
    selectSize: global.selectSize,
    noSizeSelected: "Et ole valinnut kokoa. "+global.selectSize,
    welcomingIngredientCommands: "Yll?? n??et valitut ainesosat.\n",
    ingredientCommands: global.ingredientCommands,
    continueShopping: "Voit jatkaa muiden tuotteiden lis??yst??, listata ostoskorin komennolla `!cart`, poista tuote ostoskorista komennolla `!rs <numero>` tai jatkaa kassaan komennolla `!order`",
    cartCommands: "Ostoskorista voi poistaa tuotteen komennolla `/poistakori`",
    orderingGuide: "Haluatko kuljetusta, sy??tk?? Kotipizzan ravintolassa vai noudatko ravintolasta?",
    locationNotFound: "???? Hakusanalla tai osoittella ei l??ytynyt tuloksia. Kokeile uudelleen toisella hakusanalla.",
    osmNote: "Testauspizza | ?? OpenStreetMapin tekij??t",
    searching: "???? Haetaan...",
    searchShop: "???? Hae Kotipizza ravintola sy??tt??m??ll?? hakusana:",
    searchNearestShop: "???? Haetaan l??himm??t ravintolat...",
    enterDeliveryAddress: "??????? Sy??t?? toimitusosoite muodossa (<Osoite>, <Postinumero>, <Kaupunki>)",
    invalidAddressFormat: "Osoitteen muoto ei ole oikein. Oikea muoto: <Osoite>, <Postinumero>, <Kaupunki>",
    selectLocation: "Valitse ravintola",
    noPickupLocationForDelivery: "??????Osoitteelle ei l??ytynyt toimitukselle ravintoloita. Valitse toinen toimitusvaihtoehto, esim. nouto tai ravintolassa sy??minen.",
    invalidDelType: "V????r?? toimitustapa, ",
    delOptions: "Haluatko tilata heti vai tehd?? ennakkotilauksen?\nVastaa `heti` tai `ennakkotilaus`.",
    contactInfo: {
        name: "Sy??t?? etunimesi:",
        surname: "Sy??t?? sukunimesi:",
        email: "Sy??t?? s??hk??postiosoitteesi:",
        phone: "Sy??t?? puhelinnumerosi:"
    },
    orderNeedsPayment: "Tilauksesi on tehty. Siirry maksamaan haluamasi maksutavalla. Sinut uudelleenohjataan tilauksenseurantasivulle.",
    paymentMethod: "Maksu:",
    noPointsAvailable: "??????Valitettavasti saatavilla olevat Kotipizza-ravintolat ovat kiinni ja/tai ei hyv??ksy nykyist?? toimitusehtoa. Kokeile vaihtaa toimitustapa tai ravintolan hakusana."
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