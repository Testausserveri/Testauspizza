const api = require('../kotipizza/api');

api.getIngredientsWithCategories().then(catsAndIngreds => {
    catsAndIngreds.forEach(category => {
        console.log("CatID: "+category.ingredientCategoryID+", Name: "+category.name);
        category.ingredients.forEach(item => {
            if (item.isActive) {
                console.log("IngrdientID: "+item.ingredientID+", Name: "+item.name);
                item.ingredientdosings.forEach(item => {
                    console.log("--> "+item.productSizeID+", Price: "+item.priceWithVAT+"€");
                })
                console.log("");
            }
        })
    });
})