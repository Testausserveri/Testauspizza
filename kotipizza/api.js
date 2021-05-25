const config = require('./config');
const http = require('./httpclient');

function getProductsSortedByCategories() {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/products/", res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}

function getIngredients() {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/ingredients/", res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}

function search(query) {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/search/"+query, res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}


function getIngredient(id) {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/ingredients/"+id, res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else if (res.statusCode === 404) {
                resolve(undefined);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}


function getIngredientCategories() {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/ingredients/categories", res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}

function getIngredientsWithCategories() {
    return new Promise((resolve, reject) => {
        this.getIngredientCategories().then(categories => {
            this.getIngredients().then(ingredients => {
                let reconstructedCategories = [];
                categories.forEach(item => {
                    let filteredIngredients = ingredients.filter(ingredient => {return ingredient !== undefined && ingredient.isActive && ingredient.ingredientCategoryID===item.ingredientCategoryID})
                    if (filteredIngredients.length > 0) {
                        item.ingredients = filteredIngredients;
                        reconstructedCategories.push(item);
                    }
                })
                resolve(reconstructedCategories);
            }).catch(err => {reject(err)});
        }).catch(err => {reject(err)});
    });
}

function getHotStops() {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/hotspots/", res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}

function getShops() {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/shops/", res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}

function getPopularProducts() {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/popular/", res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}

function getProduct(id) {
    return new Promise((resolve, reject) => {
        http.get(config.baseUrl+"/api/v2/products/"+id, res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else if (res.statusCode === 404) {
                resolve(undefined);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}

function makeOrder() {
    // TODO WIP!
}

module.exports = {
    getIngredients,
    getShops,
    getHotStops,
    getProductsSortedByCategories,
    getPopularProducts,
    makeOrder,
    getIngredient,
    getIngredientCategories,
    getIngredientsWithCategories,
    getProduct,
    search
}