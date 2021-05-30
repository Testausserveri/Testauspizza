let baseUrl = "https://kp-apiv2.azurewebsites.net";
let eComBaseUrl = "https://apim-kotipizza-ecom-prod.azure-api.net";

function getCODPaymentLink(orderKey, orderId) {
    return `https://kp-apiv2.azurewebsites.net/api/v2/order/${orderKey}/pay/COD?redirectUrl=${encodeURIComponent("https://kotipizza.fi/tilaus/tulos?status=OK&orderid="+orderId)}`;
}

module.exports = {
    baseUrl,
    eComBaseUrl,
    getCODPaymentLink
}