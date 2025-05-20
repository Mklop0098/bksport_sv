export const calculateTotalPriceAfterDiscount = (orderDetails: any) => {
    let totalPriceAfterDiscount = 0

    orderDetails.forEach((detail: any) => {
        const price = detail.price_import;
        const quantity = detail.quantity;
        const discountType = detail.discount_type;
        const discountValue = detail.discount_value;

        let discountedPrice = price * quantity;

        if (discountType === 1) {
            discountedPrice -= discountedPrice * (discountValue / 100);
        } else if (discountType === 2) {
            discountedPrice -= discountValue;
        }

        totalPriceAfterDiscount += discountedPrice;
    });

    return totalPriceAfterDiscount;
}